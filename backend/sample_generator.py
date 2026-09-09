import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_documents")
os.makedirs(SAMPLE_DIR, exist_ok=True)

def get_font(size=14, bold=False):
    # Try system fonts or default
    font_paths = [
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\calibrib.ttf" if bold else "C:\\Windows\\Fonts\\calibri.ttf",
        "C:\\Windows\\Fonts\\segoeui.ttf"
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_official_stamp(draw, center_x, center_y, radius=55, text="TEHSILDAR SADAR LUCKNOW"):
    # Draw circular stamp in indigo/purple ink
    ink_color = (25, 45, 130, 210)
    draw.ellipse([center_x - radius, center_y - radius, center_x + radius, center_y + radius], outline=ink_color, width=3)
    draw.ellipse([center_x - radius + 7, center_y - radius + 7, center_x + radius - 7, center_y + radius - 7], outline=ink_color, width=1)
    
    font_stamp = get_font(10, bold=True)
    draw.text((center_x - 45, center_y - 18), "GOVT. OF U.P.", fill=ink_color, font=font_stamp)
    draw.text((center_x - 38, center_y - 3), "★ VERIFIED ★", fill=ink_color, font=font_stamp)
    draw.text((center_x - 42, center_y + 12), "REVENUE DEPT", fill=ink_color, font=font_stamp)

def create_jamabandi_document(
    filename: str,
    owner_name: str,
    father_name: str,
    village: str,
    khasra_no: str,
    khata_no: str,
    area_ha: float,
    land_type: str = "Agricultural - Irrigated",
    mutation_note: str = "Order Date: 14-06-2022 - Mutation Entry Certified",
    doc_id: str = "UP-REV-2024-8841",
    degraded: bool = False
):
    width, height = 1000, 1350
    # Aged paper parchment color
    base_color = (252, 250, 242) if not degraded else (244, 240, 228)
    image = Image.new("RGB", (width, height), base_color)
    draw = ImageDraw.Draw(image)

    # Outer ornate double borders
    draw.rectangle([25, 25, width - 25, height - 25], outline=(40, 50, 70), width=3)
    draw.rectangle([32, 32, width - 32, height - 32], outline=(120, 130, 150), width=1)

    # Top Header
    f_title = get_font(22, bold=True)
    f_sub = get_font(15, bold=True)
    f_body = get_font(14, bold=False)
    f_bold = get_font(14, bold=True)
    f_small = get_font(12, bold=False)

    # Government Title
    draw.text((width // 2 - 210, 45), "GOVERNMENT OF UTTAR PRADESH", fill=(20, 30, 60), font=f_title)
    draw.text((width // 2 - 230, 78), "BOARD OF REVENUE / राजस्व परिषद (भू-अभिलेख विभाग)", fill=(60, 70, 90), font=f_sub)
    draw.text((width // 2 - 180, 105), "ROR / JAMABANDI (खतौनी - अधिकार अभिलेख)", fill=(10, 80, 50), font=f_sub)

    # Decorative header divider
    draw.line([(50, 135), (width - 50, 135)], fill=(40, 50, 70), width=2)
    draw.line([(50, 138), (width - 50, 138)], fill=(120, 130, 150), width=1)

    # Administrative Metadata Grid
    y_meta = 155
    draw.rectangle([50, y_meta, width - 50, y_meta + 120], fill=(245, 247, 250), outline=(180, 190, 205), width=1)

    # Column 1
    draw.text((70, y_meta + 15), "State: Uttar Pradesh", fill=(30, 40, 60), font=f_bold)
    draw.text((70, y_meta + 45), f"District: Lucknow", fill=(30, 40, 60), font=f_body)
    draw.text((70, y_meta + 75), f"Tehsil: Sadar", fill=(30, 40, 60), font=f_body)

    # Column 2
    draw.text((400, y_meta + 15), f"Village: {village}", fill=(30, 40, 60), font=f_bold)
    draw.text((400, y_meta + 45), f"Pargana: Bijnor", fill=(30, 40, 60), font=f_body)
    draw.text((400, y_meta + 75), f"Fasli Year: 1429-1434", fill=(30, 40, 60), font=f_body)

    # Column 3
    draw.text((720, y_meta + 15), f"Doc ID: {doc_id}", fill=(120, 30, 30), font=f_bold)
    draw.text((720, y_meta + 45), f"Date: 12/04/2023", fill=(30, 40, 60), font=f_body)
    draw.text((720, y_meta + 75), f"Status: Computerized Record", fill=(20, 100, 40), font=f_small)

    # Main Extract Section
    y_table = 300
    draw.text((50, y_table), "EXTRACT OF LAND RIGHTS REGISTER (प्रपत्र संख्या - 41)", fill=(20, 30, 60), font=f_bold)

    # Table Headers
    col_x = [50, 170, 310, 570, 720, width - 50]
    row_h = 45
    draw.rectangle([50, y_table + 30, width - 50, y_table + 30 + row_h], fill=(225, 235, 245), outline=(60, 80, 110), width=2)

    headers = [
        ("Khata No. (खाता)", 60),
        ("Khasra No. (खसरा)", 175),
        ("Landholder / Guardian (खातेदार का नाम)", 315),
        ("Area (क्षेत्रफल)", 575),
        ("Remarks / Mutation (आदेश)", 725)
    ]
    for txt, x in headers:
        draw.text((x, y_table + 42), txt, fill=(20, 30, 50), font=get_font(12, bold=True))

    for x in col_x:
        draw.line([(x, y_table + 30), (x, y_table + 290)], fill=(80, 100, 130), width=1)

    f_cell_bold = get_font(17, bold=True)
    f_cell_owner = get_font(16, bold=True)

    # Table Row 1 (Primary parcel)
    y_r1 = y_table + 80
    draw.rectangle([50, y_r1, width - 50, y_r1 + 80], fill=(255, 255, 255), outline=(150, 160, 180), width=1)

    draw.text((85, y_r1 + 25), f"Khata: {khata_no}", fill=(10, 20, 40), font=f_cell_bold)
    draw.text((180, y_r1 + 25), f"Khasra: {khasra_no}", fill=(15, 25, 50), font=f_cell_bold)

    draw.text((320, y_r1 + 12), f"Owner: {owner_name}", fill=(15, 25, 50), font=f_cell_owner)
    draw.text((320, y_r1 + 42), f"Father: {father_name}", fill=(60, 70, 80), font=f_body)

    draw.text((580, y_r1 + 25), f"Area: {area_ha:.2f} ha", fill=(10, 30, 60), font=f_cell_bold)
    draw.text((730, y_r1 + 15), mutation_note[:32], fill=(40, 50, 70), font=f_small)
    draw.text((730, y_r1 + 40), mutation_note[32:64] if len(mutation_note) > 32 else "Clear Title", fill=(60, 70, 90), font=f_small)

    # Table Row 2 (Adjacent parcel for realism)
    y_r2 = y_r1 + 85
    draw.rectangle([50, y_r2, width - 50, y_r2 + 70], fill=(250, 252, 255), outline=(180, 190, 205), width=1)
    draw.text((85, y_r2 + 20), "Khata: 105", fill=(70, 80, 90), font=f_body)
    draw.text((180, y_r2 + 20), "Khasra: 245/1", fill=(70, 80, 90), font=f_body)
    draw.text((320, y_r2 + 12), "Owner: Gram Sabha Public Land", fill=(70, 80, 90), font=f_body)
    draw.text((320, y_r2 + 38), "Father: State of Uttar Pradesh", fill=(100, 110, 120), font=f_small)
    draw.text((580, y_r2 + 20), "Area: 0.35 ha", fill=(70, 80, 90), font=f_body)
    draw.text((730, y_r2 + 20), "Chak Marg / Pathway", fill=(90, 100, 110), font=f_small)

    # Bottom summary box
    y_sum = y_r2 + 100
    draw.rectangle([50, y_sum, width - 50, y_sum + 160], fill=(248, 249, 250), outline=(190, 200, 215), width=1)
    draw.text((70, y_sum + 20), "LAND RECORD DETAILS & REVENUE ASSESSMENT", fill=(20, 40, 80), font=f_bold)
    draw.text((70, y_sum + 55), f"Category: {land_type}", fill=(40, 50, 60), font=f_body)
    draw.text((70, y_sum + 85), f"Land Revenue Payable (लगान): Rs. 48.50 / annum", fill=(40, 50, 60), font=f_body)
    draw.text((70, y_sum + 115), f"Verified By: Computer Center, Collectorate Lucknow", fill=(80, 90, 100), font=f_small)

    draw.text((520, y_sum + 55), f"Tehsil Circle: Circle No. 04 (Rural)", fill=(40, 50, 60), font=f_body)
    draw.text((520, y_sum + 85), f"Last Cadastral Survey Year: 2021-2022", fill=(40, 50, 60), font=f_body)
    draw.text((520, y_sum + 115), f"Digital Signature ID: DSC-REV-UP-{random.randint(10000, 99999)}", fill=(80, 90, 100), font=f_small)

    # Official Revenue Seal / Stamp
    draw_official_stamp(draw, width - 170, height - 240, radius=60)

    # Signature and Sign-off
    draw.line([(width - 270, height - 120), (width - 70, height - 120)], fill=(40, 50, 70), width=1)
    draw.text((width - 250, height - 110), "Revenue Inspector / Tehsildar", fill=(30, 40, 60), font=f_bold)
    draw.text((width - 230, height - 90), "Tehsil Sadar, Lucknow", fill=(60, 70, 80), font=f_small)

    # Footnote watermark disclaimer
    draw.text((70, height - 70), "Note: This is a digitized copy certified under Uttar Pradesh Revenue Code, 2006.", fill=(110, 120, 130), font=f_small)
    draw.text((70, height - 50), "Intelligent Land Record Validation Prototype | SIH Project ASCENDX", fill=(140, 150, 160), font=f_small)

    if degraded:
        # Simulate slight blur, salt-and-pepper noise and skew for Demo 6
        image = image.filter(ImageFilter.GaussianBlur(radius=0.8))
        # Add random salt/pepper noise
        pixels = image.load()
        for _ in range(8000):
            rx = random.randint(30, width - 30)
            ry = random.randint(30, height - 30)
            c = random.randint(160, 220)
            pixels[rx, ry] = (c, c, c)

    output_path = os.path.join(SAMPLE_DIR, filename)
    image.save(output_path, quality=95)
    return output_path

def generate_all_samples():
    print("Generating 7 realistic SIH Demo Land Records...")

    # 1. Clean Valid Record (Ramesh Kumar, Khasra 245/2, Area 1.05 ha)
    create_jamabandi_document(
        filename="demo_1_clean_record.png",
        owner_name="Ramesh Kumar",
        father_name="Suresh Chandra",
        village="Rampur",
        khasra_no="245/2",
        khata_no="104",
        area_ha=1.05,
        land_type="Agricultural - Irrigated",
        mutation_note="Order Date: 14-06-2022 - Clean Title Mutated"
    )

    # 2. Area Mismatch Record (Claims 1.20 ha vs Reference 1.05 ha)
    create_jamabandi_document(
        filename="demo_2_area_mismatch.png",
        owner_name="Ramesh Kumar",
        father_name="Suresh Chandra",
        village="Rampur",
        khasra_no="245/2",
        khata_no="104",
        area_ha=1.20,
        land_type="Agricultural - Irrigated",
        mutation_note="Survey Rectification Requested"
    )

    # 3. Owner Variation (Claims 'Ramesh Kumar' vs DB 'Ramesh Kr.')
    create_jamabandi_document(
        filename="demo_3_owner_variation.png",
        owner_name="Ramesh Kumar",
        father_name="Mahesh Chandra",
        village="Rampur",
        khasra_no="246/1",
        khata_no="112",
        area_ha=0.88,
        land_type="Agricultural - Double Crop",
        mutation_note="Succession Entry Pending Verification"
    )

    # 4. Khasra Mismatch (Claims 245/7 vs DB 245/2)
    create_jamabandi_document(
        filename="demo_4_khasra_mismatch.png",
        owner_name="Ramesh Kumar",
        father_name="Suresh Chandra",
        village="Rampur",
        khasra_no="245/7",
        khata_no="104",
        area_ha=1.05,
        land_type="Agricultural - Irrigated",
        mutation_note="Partition Claim Unverified"
    )

    # 5. Mutation / Succession Conflict (Vikram Singh, Khasra 312/1)
    create_jamabandi_document(
        filename="demo_5_mutation_issue.png",
        owner_name="Vikram Singh",
        father_name="Ranveer Singh",
        village="Rampur",
        khasra_no="312/1",
        khata_no="145",
        area_ha=2.10,
        land_type="Agricultural - Single Crop",
        mutation_note="Notice: Dispute Pending Case No 412/2020 Court of Tehsildar"
    )

    # 6. Degraded Scan / Low OCR Quality
    create_jamabandi_document(
        filename="demo_6_degraded_scan.png",
        owner_name="Ramesh Kumar",
        father_name="Suresh Chandra",
        village="Rampur",
        khasra_no="245/2",
        khata_no="104",
        area_ha=1.05,
        land_type="Agricultural - Irrigated",
        mutation_note="Faded Physical Archive Copy",
        degraded=True
    )

    # 7. Multiple Anomalies (Area Inflation + Owner Divergence + Civil Stay)
    create_jamabandi_document(
        filename="demo_7_multiple_anomalies.png",
        owner_name="Dinesh Kumar Verma",
        father_name="Kailash Chandra Verma",
        village="Rampur",
        khasra_no="245/7",
        khata_no="118",
        area_ha=1.45,
        land_type="Commercial - Highway Facing",
        mutation_note="Court Injunction Order Dated 10-01-2023"
    )

    print("All 7 demo sample documents successfully created in:", SAMPLE_DIR)

if __name__ == "__main__":
    generate_all_samples()
