import pandas as pd
import sys

try:
    file_path = 'KERIS_공교육 중심 에듀테크 가치평가모형 평가양식_v3.0_251229.xlsx'
    df = pd.read_excel(file_path, sheet_name=0)
    # Column O is index 14 (A=0, B=1, ..., O=14)
    if len(df.columns) > 14:
        print("--- Column O Content ---")
        for i, val in enumerate(df.iloc[:, 14]):
            print(f"Row {i+2}: {val}")
    else:
        print(f"Excel file only has {len(df.columns)} columns.")
except Exception as e:
    print(f"Error: {e}")

