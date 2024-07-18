import pandas as pd
import json
import os
import sys

def excel_to_json(excel_path, json_path):
    try:
        # Read the Excel file
        df = pd.read_excel(excel_path)
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict(orient='records')
        
        # Replace NaN values with None (which will be converted to null in JSON)
        data = [{k: (v if not pd.isna(v) else None) for k, v in item.items()} for item in data]
        
        # Write to JSON file
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        print(f"Successfully converted Excel to JSON: {json_path}")
    except Exception as e:
        print(f"Error converting Excel to JSON: {str(e)}")
        raise
    
def main():
    if len(sys.argv) < 3:
        print("Usage: python excel_to_json.py <username> <platform>")
        sys.exit(1)

    username = sys.argv[1]
    platform = sys.argv[2]
    
    # Construct the paths
    if platform == 'instagram':
        excel_path = os.path.join(os.getcwd(), username, f'{username}_post_details.xlsx')
    elif platform == 'tiktok':
        excel_path = os.path.join(os.getcwd(), f"{username}_content", f'{username}_tiktok_data.xlsx')
    else:
        print(f"Unsupported platform: {platform}")
        sys.exit(1)
    
    # Save JSON in the scripts directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, f'{username}_{platform}_data.json')
    
    print(f"Excel path: {excel_path}")
    print(f"JSON path: {json_path}")
    
    # Convert Excel to JSON
    excel_to_json(excel_path, json_path)
    
    print(f"JSON file has been created at: {json_path}")

if __name__ == "__main__":
    main()