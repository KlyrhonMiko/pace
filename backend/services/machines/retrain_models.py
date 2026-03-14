"""
Model Retraining Script for Employability Predictor

This script retrains both models (with and without CGPA) on new data
and generates updated .pkl files. Designed to be called from an admin
interface after uploading a new CSV file.

Usage:
    from retrain_models import retrain_models
    
    result = retrain_models(
        csv_path='path/to/new_data.csv',
        output_dir='backend/services/machines/random_pickles'
    )
    
    if result['success']:
        print(f"Models retrained successfully!")
        print(f"Model 1 accuracy: {result['metrics']['model1_accuracy']}")
    else:
        print(f"Retraining failed: {result['error']}")
"""

import pandas as pd
import pickle
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import warnings
warnings.filterwarnings('ignore')


def validate_csv(df: pd.DataFrame) -> tuple[bool, str]:
    """
    Validate that the CSV has all required columns and valid data.

    Returns:
        (is_valid, error_message)
    """
    required_columns = [
        'CGPA', 'Average Prof Grade', 'Average Elec Grade', 'OJT Grade',
        'Leadership POS', 'Act Member POS', 'Soft Skills Ave', 'Hard Skills Ave',
        'Degree', 'Year Graduated', 'Employability'
    ]

    # Check for required columns
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        return False, f"Missing required columns: {', '.join(missing)}"

    # Check Employability values
    valid_employability = {'Employable', 'Not Employable'}
    unique_emp = set(df['Employability'].dropna().unique())
    if not unique_emp.issubset(valid_employability):
        return False, f"Invalid Employability values. Must be 'Employable' or 'Not Employable'. Found: {unique_emp}"

    # Check for minimum data size
    if len(df) < 100:
        return False, f"Dataset too small. Need at least 100 students, got {len(df)}"

    # Check class balance
    emp_counts = df['Employability'].value_counts()
    minority_class = emp_counts.min()
    if minority_class < 20:
        return False, f"Class imbalance too severe. Smallest class has only {minority_class} samples (need at least 20)"

    return True, "Validation passed"


def preprocess_data(df: pd.DataFrame, include_cgpa: bool = True) -> tuple:
    """
    Preprocess data for model training.

    Returns:
        (X, y, feature_info)
    """
    df_processed = df.copy()

    # 1. Drop identifier columns
    cols_to_drop = ['Student Number', 'Age',
                    'Gender'] if 'Student Number' in df.columns else []
    if not include_cgpa:
        cols_to_drop.append('CGPA')

    df_processed = df_processed.drop(
        columns=[col for col in cols_to_drop if col in df_processed.columns])

    # 2. Remove completely empty columns
    empty_cols = df_processed.columns[df_processed.isna().all()].tolist()
    df_processed = df_processed.drop(columns=empty_cols)

    # 3. Define common features
    common_features = ['Average Prof Grade', 'Average Elec Grade', 'OJT Grade',
                       'Leadership POS', 'Act Member POS', 'Soft Skills Ave', 'Hard Skills Ave']
    if include_cgpa:
        common_features.insert(0, 'CGPA')

    # 4. Find program-specific features
    numeric_cols = df_processed.select_dtypes(
        include=['number']).columns.tolist()
    program_specific = [col for col in numeric_cols
                        if col not in common_features
                        and col not in ['Employability', 'Year Graduated']]

    # 5. Fill NaN in program-specific skills
    if program_specific:
        df_processed[program_specific] = df_processed[program_specific].fillna(
            0)

    # 6. Convert Yes/No to binary
    df_processed['Leadership POS'] = df_processed['Leadership POS'].map({
                                                                        'Yes': 1, 'No': 0})
    df_processed['Act Member POS'] = df_processed['Act Member POS'].map({
                                                                        'Yes': 1, 'No': 0})

    # 7. One-hot encode Degree
    df_processed = pd.get_dummies(
        df_processed, columns=['Degree'], prefix='Program')

    # 8. Prepare features and target
    X = df_processed.drop('Employability', axis=1)
    y = df_processed['Employability'].map(
        {'Employable': 1, 'Not Employable': 0})

    # Store feature info
    feature_info = {
        'common_features': common_features,
        'program_specific': program_specific,
        'feature_columns': X.columns.tolist(),
        'dummy_columns': [col for col in X.columns if col.startswith('Program_')],
        'includes_cgpa': include_cgpa
    }

    return X, y, feature_info


def train_model(X, y) -> RandomForestClassifier:
    """Train a Random Forest model with the same hyperparameters as original."""
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=20,
        min_samples_leaf=10,
        class_weight='balanced',
        random_state=42
    )
    model.fit(X, y)
    return model


def evaluate_model(model, X, y) -> dict:
    """Evaluate model performance."""
    # Cross-validation
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    cv_f1 = cross_val_score(model, X, y, cv=5, scoring='f1')

    # Train-test split for detailed metrics
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model_temp = train_model(X_train, y_train)
    y_pred = model_temp.predict(X_test)

    return {
        'cv_accuracy_mean': float(cv_scores.mean()),
        'cv_accuracy_std': float(cv_scores.std()),
        'cv_f1_mean': float(cv_f1.mean()),
        'cv_f1_std': float(cv_f1.std()),
        'test_accuracy': float(accuracy_score(y_test, y_pred)),
    }


def backup_existing_models(output_dir: Path):
    """Backup existing models before overwriting."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = output_dir / 'backups' / timestamp
    backup_dir.mkdir(parents=True, exist_ok=True)

    model_files = [
        'model1_realistic.pkl',
        'model1_info.pkl',
        'model2_improvement.pkl',
        'model2_info.pkl'
    ]

    backed_up = []
    for filename in model_files:
        src = output_dir / filename
        if src.exists():
            dst = backup_dir / filename
            import shutil
            shutil.copy2(src, dst)
            backed_up.append(filename)

    return backup_dir if backed_up else None


def retrain_models(
    csv_path: str,
    output_dir: str = 'backend/services/machines/random_pickles',
    backup: bool = True,
    validate_only: bool = False
) -> dict:
    """
    Retrain both employability models on new data.

    Args:
        csv_path: Path to the CSV file with new training data
        output_dir: Directory where .pkl files will be saved
        backup: If True, backup existing models before overwriting
        validate_only: If True, only validate the CSV without training

    Returns:
        {
            'success': bool,
            'message': str,
            'metrics': {
                'dataset_size': int,
                'num_features': int,
                'programs': list[str],
                'model1_accuracy': float,
                'model1_cv_accuracy': float,
                'model2_accuracy': float,
                'model2_cv_accuracy': float,
            },
            'backup_location': str (if backup=True),
            'error': str (if success=False)
        }
    """
    result = {
        'success': False,
        'message': '',
        'metrics': {},
        'backup_location': None,
        'error': None
    }

    try:
        # 1. Load and validate CSV
        print(f"Loading CSV from: {csv_path}")
        df = pd.read_csv(csv_path)

        is_valid, validation_msg = validate_csv(df)
        if not is_valid:
            result['error'] = f"Validation failed: {validation_msg}"
            return result

        print(f"✅ CSV validation passed: {validation_msg}")
        print(f"   Dataset size: {len(df)} students")

        # If only validating, stop here
        if validate_only:
            result['success'] = True
            result['message'] = 'CSV validation successful'
            result['metrics']['dataset_size'] = len(df)
            return result

        # 2. Backup existing models
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        if backup:
            backup_location = backup_existing_models(output_path)
            if backup_location:
                result['backup_location'] = str(backup_location)
                print(f"✅ Backed up existing models to: {backup_location}")

        # 3. Preprocess data for both models
        print("\n📊 Preprocessing data...")
        X1, y1, info1 = preprocess_data(df, include_cgpa=True)
        X2, y2, info2 = preprocess_data(df, include_cgpa=False)

        programs = [col.replace('Program_', '')
                    for col in info1['dummy_columns']]
        print(f"   Features (Model 1): {X1.shape[1]}")
        print(f"   Features (Model 2): {X2.shape[1]}")
        print(f"   Programs detected: {', '.join(programs)}")

        # 4. Train Model 1 (with CGPA)
        print("\n🔧 Training Model 1 (Realistic Assessment - with CGPA)...")
        model1 = train_model(X1, y1)
        metrics1 = evaluate_model(model1, X1, y1)
        print(
            f"   CV Accuracy: {metrics1['cv_accuracy_mean']:.3f} (±{metrics1['cv_accuracy_std']:.3f})")
        print(f"   Test Accuracy: {metrics1['test_accuracy']:.3f}")

        # 5. Train Model 2 (without CGPA)
        print("\n🔧 Training Model 2 (Improvement Roadmap - without CGPA)...")
        model2 = train_model(X2, y2)
        metrics2 = evaluate_model(model2, X2, y2)
        print(
            f"   CV Accuracy: {metrics2['cv_accuracy_mean']:.3f} (±{metrics2['cv_accuracy_std']:.3f})")
        print(f"   Test Accuracy: {metrics2['test_accuracy']:.3f}")

        # 6. Save models
        print("\n💾 Saving models...")
        with open(output_path / 'model1_realistic.pkl', 'wb') as f:
            pickle.dump(model1, f)
        with open(output_path / 'model1_info.pkl', 'wb') as f:
            pickle.dump(info1, f)
        with open(output_path / 'model2_improvement.pkl', 'wb') as f:
            pickle.dump(model2, f)
        with open(output_path / 'model2_info.pkl', 'wb') as f:
            pickle.dump(info2, f)

        print(f"   ✅ Saved to: {output_path}")

        # 7. Compile results
        result['success'] = True
        result['message'] = 'Models retrained successfully'
        result['metrics'] = {
            'dataset_size': len(df),
            'num_features_model1': X1.shape[1],
            'num_features_model2': X2.shape[1],
            'programs': programs,
            'model1_cv_accuracy': round(metrics1['cv_accuracy_mean'], 3),
            'model1_cv_std': round(metrics1['cv_accuracy_std'], 3),
            'model1_test_accuracy': round(metrics1['test_accuracy'], 3),
            'model2_cv_accuracy': round(metrics2['cv_accuracy_mean'], 3),
            'model2_cv_std': round(metrics2['cv_accuracy_std'], 3),
            'model2_test_accuracy': round(metrics2['test_accuracy'], 3),
        }

        print("\n" + "="*60)
        print("✅ RETRAINING COMPLETE")
        print("="*60)
        print(f"Dataset: {len(df)} students, {len(programs)} programs")
        print(
            f"Model 1 (with CGPA): {metrics1['cv_accuracy_mean']:.1%} accuracy")
        print(
            f"Model 2 (no CGPA): {metrics2['cv_accuracy_mean']:.1%} accuracy")
        print("="*60)

        return result

    except Exception as e:
        result['error'] = str(e)
        result['message'] = 'Retraining failed'
        print(f"\n❌ Error during retraining: {e}")
        import traceback
        traceback.print_exc()
        return result


def rollback_models(backup_dir: str, output_dir: str = 'backend/services/machines/random_pickles') -> bool:
    """
    Rollback to a previous model version from backup.

    Args:
        backup_dir: Path to backup directory (e.g., from result['backup_location'])
        output_dir: Directory where current models are stored

    Returns:
        True if rollback successful, False otherwise
    """
    try:
        import shutil
        backup_path = Path(backup_dir)
        output_path = Path(output_dir)

        model_files = [
            'model1_realistic.pkl',
            'model1_info.pkl',
            'model2_improvement.pkl',
            'model2_info.pkl'
        ]

        for filename in model_files:
            src = backup_path / filename
            dst = output_path / filename
            if src.exists():
                shutil.copy2(src, dst)
                print(f"✅ Restored {filename}")

        print(f"✅ Rollback complete from: {backup_dir}")
        return True

    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        return False


# ==============================================================================
# Example usage for testing
# ==============================================================================

if __name__ == "__main__":
    # Test retraining with a CSV file
    result = retrain_models(
        csv_path='plp_dataset_500.csv',  # Replace with your CSV path
        output_dir='test_output',
        backup=True
    )

    if result['success']:
        print("\n✅ SUCCESS!")
        print(f"Message: {result['message']}")
        print(f"Metrics: {result['metrics']}")
        if result['backup_location']:
            print(f"Backup: {result['backup_location']}")
    else:
        print("\n❌ FAILED!")
        print(f"Error: {result['error']}")
