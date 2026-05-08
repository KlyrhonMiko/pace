import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report
import joblib

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from services.machines.career_track import split_skills

def main():
    base_dir = Path("d:/projects/pace/backend")
    data_path = base_dir / "data" / "career_track_data.csv"
    
    if not data_path.exists():
        print(f"Error: {data_path} not found. Please run simulate_career_data.py first.")
        return

    print("Loading data...")
    df = pd.read_csv(data_path)
    
    # Fill NaN skills with empty string if any
    df['skills'] = df['skills'].fillna('')
    
    # Target and Features
    X = df[['skills', 'internship_duration', 'gwa']]
    y = df['career_track']

    # Feature engineering for skills text
    text_transformer = TfidfVectorizer(analyzer=split_skills)

    # ColumnTransformer to apply TF-IDF only to 'skills', and passthrough for numerical columns
    preprocessor = ColumnTransformer(
        transformers=[
            ('skills', text_transformer, 'skills'),
            ('num', 'passthrough', ['internship_duration', 'gwa'])
        ]
    )

    # Creating the scikit-learn Pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    # Split dataset
    print("Splitting dataset into train and test...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training a RandomForest Classification Pipeline...")
    pipeline.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = pipeline.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}\n")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))

    # Saving the model pipeline
    out_dir = base_dir / "services" / "machines" / "random_pickles"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = out_dir / "career_track_pipeline.pkl"
    print(f"Saving model pipeline to {model_path}...")
    joblib.dump(pipeline, model_path)
    print("Done!")

if __name__ == "__main__":
    main()
