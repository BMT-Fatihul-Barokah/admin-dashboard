import pandas as pd
import json

# Read the Excel file
df = pd.read_excel('transaksi-2025-06-16.xlsx')

# Open a file for writing
with open('excel_analysis.txt', 'w', encoding='utf-8') as f:
    # Write column names
    f.write("Column names:\n")
    f.write(json.dumps(df.columns.tolist(), ensure_ascii=False) + "\n\n")
    
    # Write sample data (all rows since it's a small file)
    f.write("Sample data (all rows):\n")
    records = df.to_dict('records')
    for record in records:
        # Convert any non-serializable objects to strings
        for key, value in record.items():
            if not isinstance(value, (str, int, float, bool, type(None))):
                record[key] = str(value)
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
    
    # Write data types
    f.write("\nData types:\n")
    for col in df.columns:
        f.write(f"{col}: {df[col].dtype}\n")

print("Analysis written to excel_analysis.txt")

# Also save as JSON for potential use in import script
with open('excel_data.json', 'w', encoding='utf-8') as f:
    json_records = []
    for record in df.to_dict('records'):
        # Convert any non-serializable objects to strings
        for key, value in record.items():
            if not isinstance(value, (str, int, float, bool, type(None))):
                record[key] = str(value)
        json_records.append(record)
    json.dump(json_records, f, ensure_ascii=False, indent=2)

print("Excel data saved to excel_data.json")
