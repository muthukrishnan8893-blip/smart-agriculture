"""
ml_models/train_disease_model.py
Build and train a CNN for crop leaf disease detection using TensorFlow/Keras.

The model expects the PlantVillage dataset (or similar) organised as:
    data/
        train/
            Tomato_Healthy/
            Tomato_Late_Blight/
            ... (one folder per class)
        val/
            ...

Run: python ml_models/train_disease_model.py
Output: ml_models/disease_model.h5
"""

import os

# ── Configuration ─────────────────────────────────────────────
IMAGE_SIZE   = (224, 224)
BATCH_SIZE   = 32
EPOCHS       = 20
DATA_DIR     = os.path.join(os.path.dirname(__file__), '..', 'data')
TRAIN_DIR    = os.path.join(DATA_DIR, 'train')
VAL_DIR      = os.path.join(DATA_DIR, 'val')
MODEL_OUTPUT = os.path.join(os.path.dirname(__file__), 'disease_model.h5')

# Class labels (must match folder names and routes/disease.py CLASS_LABELS)
CLASS_NAMES = [
    'Apple_Healthy', 'Apple_Scab',
    'Corn_Common_Rust', 'Corn_Healthy',
    'Grape_Black_Rot', 'Grape_Healthy',
    'Potato_Early_Blight', 'Potato_Healthy', 'Potato_Late_Blight',
    'Rice_Blast', 'Rice_Brown_Spot', 'Rice_Healthy',
    'Tomato_Early_Blight', 'Tomato_Healthy', 'Tomato_Late_Blight',
    'Wheat_Healthy', 'Wheat_Rust'
]
NUM_CLASSES = len(CLASS_NAMES)


def build_model(num_classes: int):
    """Build a MobileNetV2-based transfer-learning model."""
    import tensorflow as tf

    base = tf.keras.applications.MobileNetV2(
        input_shape=(*IMAGE_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    base.trainable = False  # Freeze base for initial training

    model = tf.keras.Sequential([
        base,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def train():
    import tensorflow as tf

    # Check if data directory exists
    if not os.path.exists(TRAIN_DIR):
        print("ERROR: Training data directory not found.")
        print(f"Expected: {TRAIN_DIR}")
        print("Please download the PlantVillage dataset and place it under data/train/ and data/val/")
        print("Dataset: https://www.kaggle.com/datasets/emmarex/plantdisease")
        return

    # Data augmentation pipelines
    train_gen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.15
    )

    val_gen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1.0 / 255)

    train_ds = train_gen.flow_from_directory(
        TRAIN_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    val_ds = val_gen.flow_from_directory(
        VAL_DIR,
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

    model = build_model(train_ds.num_classes)
    model.summary()

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3),
        tf.keras.callbacks.ModelCheckpoint(MODEL_OUTPUT, save_best_only=True)
    ]

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=callbacks
    )

    model.save(MODEL_OUTPUT)
    print(f"\n✓ Disease model saved → {MODEL_OUTPUT}")

    # Print class index mapping
    print("\nClass indices:", train_ds.class_indices)


if __name__ == '__main__':
    train()
