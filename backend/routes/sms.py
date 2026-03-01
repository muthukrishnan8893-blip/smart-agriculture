"""
routes/sms.py - SMS Notification Alert System
Handles: Alert subscriptions, sending SMS, alert history
"""

import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.extensions import db
from backend.models.db_models import User, SMSAlert, SMSLog

sms_bp = Blueprint('sms', __name__)

# ── Alert type definitions ────────────────────────────────────
ALERT_TYPES = {
    'weather':  'Weather Alerts (storms, heavy rain, frost)',
    'price':    'Market Price Alerts (price drops / spikes)',
    'disease':  'Disease Outbreak Alerts',
    'scheme':   'Government Scheme Deadline Reminders',
    'water':    'Irrigation / Watering Reminders',
    'harvest':  'Harvest Time Notifications',
}

# ── Mock SMS sender (replace with Twilio / MSG91 in production) ─
def _send_sms(phone: str, message: str) -> dict:
    """
    Mock SMS sender for development.
    In production, integrate with Twilio, MSG91, or AWS SNS:

        from twilio.rest import Client
        client = Client(TWILIO_SID, TWILIO_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE,
            to=phone
        )
        return {'sid': msg.sid, 'status': msg.status}
    """
    # Simulate delivery with 95% success rate
    success = random.random() < 0.95
    return {
        'success': success,
        'message_id': f'MSG-{random.randint(100000, 999999)}',
        'status': 'delivered' if success else 'failed',
        'phone': phone,
        'timestamp': datetime.utcnow().isoformat(),
    }


# ── GET /api/sms/alert-types ─────────────────────────────────
@sms_bp.route('/alert-types', methods=['GET'])
@jwt_required()
def get_alert_types():
    """Return all available alert types."""
    return jsonify({'alert_types': ALERT_TYPES}), 200


# ── GET /api/sms/preferences ─────────────────────────────────
@sms_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    """Get the current user's SMS alert preferences."""
    user_id = int(get_jwt_identity())
    alerts = SMSAlert.query.filter_by(user_id=user_id).all()
    return jsonify({'preferences': [a.to_dict() for a in alerts]}), 200


# ── POST /api/sms/preferences ────────────────────────────────
@sms_bp.route('/preferences', methods=['POST'])
@jwt_required()
def set_preferences():
    """Create or update SMS alert preferences for the user."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    phone = data.get('phone', user.phone)
    alert_types = data.get('alert_types', [])  # list of type keys
    crop_filter = data.get('crop_filter', user.crop_type or '')
    state_filter = data.get('state_filter', user.state or '')

    if not phone:
        return jsonify({'error': 'Phone number is required for SMS alerts'}), 400

    # Update user phone if provided
    if phone != user.phone:
        user.phone = phone
        db.session.commit()

    # Upsert each alert type
    results = []
    for atype in alert_types:
        if atype not in ALERT_TYPES:
            continue
        existing = SMSAlert.query.filter_by(user_id=user_id, alert_type=atype).first()
        if existing:
            existing.is_active = True
            existing.phone = phone
            existing.crop_filter = crop_filter
            existing.state_filter = state_filter
            existing.updated_at = datetime.utcnow()
        else:
            alert = SMSAlert(
                user_id=user_id,
                alert_type=atype,
                phone=phone,
                is_active=True,
                crop_filter=crop_filter,
                state_filter=state_filter,
            )
            db.session.add(alert)
        results.append(atype)

    # Deactivate types not in the list
    SMSAlert.query.filter(
        SMSAlert.user_id == user_id,
        ~SMSAlert.alert_type.in_(alert_types)
    ).update({'is_active': False}, synchronize_session='fetch')

    db.session.commit()

    updated = SMSAlert.query.filter_by(user_id=user_id).all()
    return jsonify({
        'message': f'SMS preferences updated ({len(results)} alerts active)',
        'preferences': [a.to_dict() for a in updated]
    }), 200


# ── DELETE /api/sms/preferences/<alert_type> ──────────────────
@sms_bp.route('/preferences/<alert_type>', methods=['DELETE'])
@jwt_required()
def delete_preference(alert_type):
    """Deactivate a specific alert type."""
    user_id = int(get_jwt_identity())
    alert = SMSAlert.query.filter_by(user_id=user_id, alert_type=alert_type).first()
    if not alert:
        return jsonify({'error': 'Alert preference not found'}), 404
    alert.is_active = False
    db.session.commit()
    return jsonify({'message': f'{alert_type} alert deactivated'}), 200


# ── POST /api/sms/send-test ──────────────────────────────────
@sms_bp.route('/send-test', methods=['POST'])
@jwt_required()
def send_test_sms():
    """Send a test SMS to verify phone number."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    phone = data.get('phone', user.phone)
    if not phone:
        return jsonify({'error': 'Phone number is required'}), 400

    message = f'🌾 Smart Agri Test: Hello {user.full_name}! Your SMS alerts are working. You will receive farming advisories on this number.'
    result = _send_sms(phone, message)

    # Log it
    log = SMSLog(
        user_id=user_id,
        phone=phone,
        alert_type='test',
        message=message,
        status=result['status'],
        message_id=result.get('message_id'),
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'result': result, 'log': log.to_dict()}), 200


# ── POST /api/sms/trigger ────────────────────────────────────
@sms_bp.route('/trigger', methods=['POST'])
@jwt_required()
def trigger_alert():
    """
    Manually trigger an alert (for demo / admin use).
    Body: { "alert_type": "weather", "message": "Heavy rain expected..." }
    """
    user_id = int(get_jwt_identity())
    data = request.get_json()
    alert_type = data.get('alert_type', 'weather')
    custom_message = data.get('message', '')

    # Find all active subscribers for this alert type
    subscribers = SMSAlert.query.filter_by(alert_type=alert_type, is_active=True).all()

    if not subscribers:
        return jsonify({'message': 'No active subscribers for this alert type', 'sent': 0}), 200

    # Build default messages per type
    default_messages = {
        'weather':  '⛈️ Weather Alert: Heavy rainfall expected in your area in the next 24 hours. Protect your crops and avoid spraying pesticides.',
        'price':    '📈 Price Alert: Market prices for your crop have changed significantly. Check the latest prices on Smart Agri.',
        'disease':  '🦠 Disease Alert: Crop disease outbreak reported in your district. Check disease detection module for prevention tips.',
        'scheme':   '📋 Scheme Reminder: Government scheme application deadline approaching. Apply now to avail benefits.',
        'water':    '💧 Irrigation Reminder: Based on weather forecast, consider adjusting your irrigation schedule today.',
        'harvest':  '🌾 Harvest Alert: Optimal harvest window approaching for your crop. Plan your harvest operations.',
    }

    message = custom_message or default_messages.get(alert_type, 'Smart Agri Notification')
    sent_count = 0
    logs = []

    for sub in subscribers:
        result = _send_sms(sub.phone, message)
        log = SMSLog(
            user_id=sub.user_id,
            phone=sub.phone,
            alert_type=alert_type,
            message=message,
            status=result['status'],
            message_id=result.get('message_id'),
        )
        db.session.add(log)
        logs.append(log)
        if result['success']:
            sent_count += 1

    db.session.commit()

    return jsonify({
        'message': f'Alert triggered: {sent_count}/{len(subscribers)} SMS sent successfully',
        'sent': sent_count,
        'total': len(subscribers),
        'logs': [l.to_dict() for l in logs],
    }), 200


# ── GET /api/sms/history ─────────────────────────────────────
@sms_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get SMS notification history for the logged-in user."""
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    logs = SMSLog.query.filter_by(user_id=user_id) \
        .order_by(SMSLog.sent_at.desc()) \
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'history': [l.to_dict() for l in logs.items],
        'total': logs.total,
        'page': logs.page,
        'pages': logs.pages,
    }), 200


# ── GET /api/sms/stats ───────────────────────────────────────
@sms_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    """Get SMS stats for the logged-in user."""
    user_id = int(get_jwt_identity())
    total_sent = SMSLog.query.filter_by(user_id=user_id).count()
    delivered = SMSLog.query.filter_by(user_id=user_id, status='delivered').count()
    failed = SMSLog.query.filter_by(user_id=user_id, status='failed').count()
    active_alerts = SMSAlert.query.filter_by(user_id=user_id, is_active=True).count()

    # Recent 7 days
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent = SMSLog.query.filter(
        SMSLog.user_id == user_id,
        SMSLog.sent_at >= week_ago
    ).count()

    return jsonify({
        'total_sent': total_sent,
        'delivered': delivered,
        'failed': failed,
        'active_alerts': active_alerts,
        'recent_7_days': recent,
    }), 200
