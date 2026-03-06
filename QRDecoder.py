import os
import csv
import requests
from PIL import Image
from pyzbar.pyzbar import decode

TBA_API_KEY = "sK9JtAoHZ98PkLKJlBcB0wGTB1IuWYJ7yet9jK47hCMw9rxu3RaO88o9p7jK9Mfx"
TBA_BASE_URL = "https://www.thebluealliance.com/api/v3"

def read_qr_code(image_path, encoding='UTF-8'):
    """
    Opens the image at image_path, decodes the first QR code found,
    and returns its text using the specified encoding.
    """
    img = Image.open(image_path)
    decoded_objects = decode(img)
    if decoded_objects:
        return decoded_objects[0].data.decode(encoding)
    return None

def parse_qr_text(qr_text):
    """
    Splits the QR code text into rows (by newline) and columns (by comma).
    Returns a list of rows (each a list of values).
    """
    return [line.split(',') for line in qr_text.splitlines() if line.strip()]

def process_folder(folder_path, output_csv, encoding='UTF-8'):
    """
    Processes all image files in folder_path, reading their QR code data,
    parsing the tab-delimited content, and writing all rows to output_csv.
    """
    all_rows = []
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            print(filename)
            file_path = os.path.join(folder_path, filename)
            qr_text = read_qr_code(file_path, encoding)
            if qr_text:
                rows = parse_qr_text(qr_text)
                all_rows.extend(rows)
            else:
                print(f"No QR code found in: {file_path}")
    if all_rows:
        with open(output_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(all_rows)
        print(f"Processed QR codes from '{folder_path}' and saved data to '{output_csv}'.")
    else:
        print("No data was found to write.")

def get_teams_from_event(event_code):
    url = f"{TBA_BASE_URL}/event/{event_code}/teams/simple"
    headers = {"X-TBA-Auth-Key": TBA_API_KEY}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return {team['team_number']: 0 for team in response.json()}
    else:
        print(f"Failed to fetch teams for event {event_code}. HTTP {response.status_code}")
        return {}

def verify_csv_teams(csv_file, valid_teams):
    cleaned_rows = []
    unknown_count = 0

    with open(csv_file, newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row_num, row in enumerate(reader, start=1):
            if not row:
                continue
            try:
                team_number = int(row[0])
                if team_number in valid_teams:
                    valid_teams[team_number] += 1
                    cleaned_rows.append(row)
                else:
                    print(f"⚠️ Unknown team {team_number} found on row {row_num} — row will be deleted.")
                    unknown_count += 1
            except ValueError:
                print(f"⚠️ Invalid team number format in row {row_num}: '{row[0]}' — row will be deleted.")
                unknown_count += 1

    # Overwrite CSV with cleaned data
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(cleaned_rows)

    print(f"\n✅ Verification complete. Removed {unknown_count} invalid row(s).")
    print("📊 Team appearance counts:")
    for team, count in sorted(valid_teams.items()):
        print(f"Team {team}: {count} time(s)")



def main():
    folder_path = 'QRs'      # Folder containing QR code image files
    output_csv = 'data.csv'
    process_folder(folder_path, output_csv)

    check = input("\nWould you like to verify teams using The Blue Alliance API? (y/n): ").strip().lower()
    if check == 'y':
        event_code = input("Enter the Blue Alliance event code (e.g., 2025bc): ").strip()
        if not TBA_API_KEY:
            print("❌ No API key found. Set the TBA_AUTH_KEY environment variable.")
            return
        valid_teams = get_teams_from_event(event_code)
        if valid_teams:
            verify_csv_teams(output_csv, valid_teams)

if __name__ == "__main__":
    main()
