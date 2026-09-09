import json
import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "land_records.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ReferenceRecord(Base):
    __tablename__ = "reference_records"

    record_id = Column(String(50), primary_key=True, index=True)
    owner_name = Column(String(100), nullable=False, index=True)
    father_name = Column(String(100), nullable=False)
    village = Column(String(100), nullable=False, index=True)
    tehsil = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Uttar Pradesh")
    khasra_no = Column(String(50), nullable=False, index=True)
    khata_no = Column(String(50), nullable=False)
    area_hectares = Column(Float, nullable=False)
    land_type = Column(String(100), default="Agricultural - Two Crop")
    mutation_status = Column(String(50), default="MUTATED_VERIFIED")
    registration_status = Column(String(50), default="REGISTERED")
    dispute_status = Column(String(100), default="CLEAR")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    survey_year = Column(Integer, default=2021)
    last_updated = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d"))

    def to_dict(self):
        return {
            "record_id": self.record_id,
            "owner_name": self.owner_name,
            "father_name": self.father_name,
            "village": self.village,
            "tehsil": self.tehsil,
            "district": self.district,
            "state": self.state,
            "khasra_no": self.khasra_no,
            "khata_no": self.khata_no,
            "area_hectares": self.area_hectares,
            "land_type": self.land_type,
            "mutation_status": self.mutation_status,
            "registration_status": self.registration_status,
            "dispute_status": self.dispute_status,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "survey_year": self.survey_year,
            "last_updated": self.last_updated
        }

class ProcessedRecord(Base):
    __tablename__ = "processed_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tracking_id = Column(String(50), unique=True, index=True)
    filename = Column(String(255))
    original_image_url = Column(String(255))
    preprocessed_image_url = Column(String(255))
    annotated_image_url = Column(String(255))
    doc_type = Column(String(100), default="Jamabandi / RoR")
    language = Column(String(50), default="English + Hindi")
    raw_ocr_text = Column(Text)
    ocr_confidence = Column(Float)
    extracted_fields = Column(Text)       # JSON string
    reference_match_id = Column(String(50), nullable=True)
    validation_status = Column(String(50)) # VALID, REVIEW_REQUIRED, HIGH_RISK
    overall_score = Column(Float)
    score_breakdown = Column(Text)        # JSON string
    anomalies = Column(Text)              # JSON string
    explainability = Column(Text)         # JSON string
    officer_decision = Column(String(50), default="PENDING") # PENDING, APPROVED, FIELD_SURVEY_REQUIRED, REJECTED
    officer_notes = Column(Text, nullable=True)
    created_at = Column(String(50), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    reviewed_at = Column(String(50), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "tracking_id": self.tracking_id,
            "filename": self.filename,
            "original_image_url": self.original_image_url,
            "preprocessed_image_url": self.preprocessed_image_url,
            "annotated_image_url": self.annotated_image_url,
            "doc_type": self.doc_type,
            "language": self.language,
            "raw_ocr_text": self.raw_ocr_text,
            "ocr_confidence": self.ocr_confidence,
            "extracted_fields": json.loads(self.extracted_fields) if self.extracted_fields else {},
            "reference_match_id": self.reference_match_id,
            "validation_status": self.validation_status,
            "overall_score": self.overall_score,
            "score_breakdown": json.loads(self.score_breakdown) if self.score_breakdown else {},
            "anomalies": json.loads(self.anomalies) if self.anomalies else [],
            "explainability": json.loads(self.explainability) if self.explainability else {},
            "officer_decision": self.officer_decision,
            "officer_notes": self.officer_notes,
            "created_at": self.created_at,
            "reviewed_at": self.reviewed_at
        }

class CadastralParcel(Base):
    __tablename__ = "cadastral_parcels"

    khasra_no = Column(String(50), primary_key=True)
    village = Column(String(100), nullable=False)
    owner_name = Column(String(100))
    area_hectares = Column(Float)
    status = Column(String(50), default="VALID") # VALID, REVIEW_REQUIRED, HIGH_RISK
    dispute_flag = Column(Boolean, default=False)
    polygon_points = Column(Text) # JSON of [[x, y], ...]
    center_x = Column(Float)
    center_y = Column(Float)
    reference_record_id = Column(String(50))

    def to_dict(self):
        return {
            "khasra_no": self.khasra_no,
            "village": self.village,
            "owner_name": self.owner_name,
            "area_hectares": self.area_hectares,
            "status": self.status,
            "dispute_flag": self.dispute_flag,
            "polygon_points": json.loads(self.polygon_points) if self.polygon_points else [],
            "center_x": self.center_x,
            "center_y": self.center_y,
            "reference_record_id": self.reference_record_id
        }

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 30 Seed records covering valid, area mismatches, fuzzy owner variations, khasra conflicts, and disputes
INITIAL_REFERENCE_RECORDS = [
    # Village: Rampur (Tehsil: Sadar, District: Lucknow)
    {
        "record_id": "UP-LKO-2024-001",
        "owner_name": "Ramesh Kumar",
        "father_name": "Suresh Chandra",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "245/1",
        "khata_no": "104",
        "area_hectares": 0.95,
        "land_type": "Agricultural - Irrigated",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "survey_year": 2022
    },
    {
        # Target for Record B & Demo 1/2: Reference area is 1.05 ha (OCR often claims 1.20 ha)
        "record_id": "UP-LKO-2024-002",
        "owner_name": "Ramesh Kumar",
        "father_name": "Suresh Chandra",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "245/2",
        "khata_no": "104",
        "area_hectares": 1.05,
        "land_type": "Agricultural - Irrigated",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.8475,
        "longitude": 80.9471,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-003",
        "owner_name": "Ramesh Kumar",
        "father_name": "Suresh Chandra",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "245/3",
        "khata_no": "104",
        "area_hectares": 1.40,
        "land_type": "Agricultural - Irrigated",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.8482,
        "longitude": 80.9480,
        "survey_year": 2022
    },
    {
        # Target for Record C: Owner variation (Database says "Ramesh Kr.")
        "record_id": "UP-LKO-2024-004",
        "owner_name": "Ramesh Kr.",
        "father_name": "Mahesh Chandra",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "246/1",
        "khata_no": "112",
        "area_hectares": 0.88,
        "land_type": "Agricultural - Double Crop",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.8490,
        "longitude": 80.9492,
        "survey_year": 2023
    },
    {
        # Target for Record D: Reference has 245/2, OCR claims 245/7
        "record_id": "UP-LKO-2024-005",
        "owner_name": "Dinesh Verma",
        "father_name": "Kailash Verma",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "245/7",
        "khata_no": "118",
        "area_hectares": 0.65,
        "land_type": "Commercial - Highway Facing",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "BOUNDARY_DISPUTE_PENDING",
        "latitude": 26.8501,
        "longitude": 80.9505,
        "survey_year": 2021
    },
    {
        # Target for Mutation Issue Demo
        "record_id": "UP-LKO-2024-006",
        "owner_name": "Vikram Singh",
        "father_name": "Ranveer Singh",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "312/1",
        "khata_no": "145",
        "area_hectares": 2.10,
        "land_type": "Agricultural - Single Crop",
        "mutation_status": "PENDING_HEIR_OBJECTION",
        "registration_status": "PROVISIONAL",
        "dispute_status": "CIVIL_COURT_STAY",
        "latitude": 26.8512,
        "longitude": 80.9520,
        "survey_year": 2020
    },
    {
        "record_id": "UP-LKO-2024-007",
        "owner_name": "Sunita Devi",
        "father_name": "W/o Rajeshwar Nath",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "312/2",
        "khata_no": "145",
        "area_hectares": 1.75,
        "land_type": "Agricultural - Irrigated",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.8524,
        "longitude": 80.9535,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-008",
        "owner_name": "Amitabh Sharma",
        "father_name": "Pandit Harish Sharma",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "108/A",
        "khata_no": "89",
        "area_hectares": 0.45,
        "land_type": "Residential Plot",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.8535,
        "longitude": 80.9548,
        "survey_year": 2023
    },
    {
        "record_id": "UP-LKO-2024-009",
        "owner_name": "Gopal Krishna Yadav",
        "father_name": "Ram Das Yadav",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "109/B",
        "khata_no": "92",
        "area_hectares": 1.82,
        "land_type": "Agricultural - Tube Well",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.8546,
        "longitude": 80.9560,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-010",
        "owner_name": "Pooja Gupta",
        "father_name": "Ashok Kumar Gupta",
        "village": "Rampur",
        "tehsil": "Sadar",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "110/1",
        "khata_no": "95",
        "area_hectares": 0.32,
        "land_type": "Commercial - Godown",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "BANK_MORTGAGE_LIEN",
        "latitude": 26.8558,
        "longitude": 80.9572,
        "survey_year": 2024
    },
    # Village: Shivpur (Tehsil: Malihabad, District: Lucknow)
    {
        "record_id": "UP-LKO-2024-011",
        "owner_name": "Harishankar Tiwari",
        "father_name": "Bhairav Tiwari",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "54/1",
        "khata_no": "34",
        "area_hectares": 2.45,
        "land_type": "Horticultural - Mango Orchard",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9123,
        "longitude": 80.7145,
        "survey_year": 2021
    },
    {
        "record_id": "UP-LKO-2024-012",
        "owner_name": "Mohammad Rizwan",
        "father_name": "Abdul Rashid",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "54/2",
        "khata_no": "34",
        "area_hectares": 1.90,
        "land_type": "Horticultural - Mango Orchard",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9135,
        "longitude": 80.7160,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-013",
        "owner_name": "Kusum Lata",
        "father_name": "W/o Jagdish Prasad",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "55/3",
        "khata_no": "39",
        "area_hectares": 1.15,
        "land_type": "Agricultural - Irrigated",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9147,
        "longitude": 80.7172,
        "survey_year": 2023
    },
    {
        "record_id": "UP-LKO-2024-014",
        "owner_name": "Satish Chand",
        "father_name": "Prem Chand",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "56/1",
        "khata_no": "42",
        "area_hectares": 3.10,
        "land_type": "Agricultural - Canal Fed",
        "mutation_status": "PENDING_MUTATION",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9158,
        "longitude": 80.7188,
        "survey_year": 2020
    },
    {
        "record_id": "UP-LKO-2024-015",
        "owner_name": "Balram Singh",
        "father_name": "Dharmraj Singh",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "57/2",
        "khata_no": "45",
        "area_hectares": 0.78,
        "land_type": "Agricultural",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9170,
        "longitude": 80.7201,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-016",
        "owner_name": "Anil Kumar Mishra",
        "father_name": "Vidyadhar Mishra",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "58/1",
        "khata_no": "50",
        "area_hectares": 1.60,
        "land_type": "Agricultural - Well Irrigated",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9182,
        "longitude": 80.7215,
        "survey_year": 2023
    },
    {
        "record_id": "UP-LKO-2024-017",
        "owner_name": "Shyam Sundar Pal",
        "father_name": "Mata Prasad Pal",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "59/4",
        "khata_no": "55",
        "area_hectares": 0.55,
        "land_type": "Residential - Abadi",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9194,
        "longitude": 80.7230,
        "survey_year": 2024
    },
    {
        "record_id": "UP-LKO-2024-018",
        "owner_name": "Deepak Lodhi",
        "father_name": "Kripal Lodhi",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "60/1",
        "khata_no": "61",
        "area_hectares": 2.25,
        "land_type": "Agricultural - Double Crop",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9205,
        "longitude": 80.7245,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-019",
        "owner_name": "Rekha Patel",
        "father_name": "W/o Santosh Patel",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "61/2",
        "khata_no": "68",
        "area_hectares": 1.35,
        "land_type": "Agricultural",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9218,
        "longitude": 80.7260,
        "survey_year": 2023
    },
    {
        "record_id": "UP-LKO-2024-020",
        "owner_name": "Narendra Chauhan",
        "father_name": "Brijpal Chauhan",
        "village": "Shivpur",
        "tehsil": "Malihabad",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "62/3",
        "khata_no": "72",
        "area_hectares": 0.92,
        "land_type": "Commercial - Petrol Pump Leased",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9230,
        "longitude": 80.7275,
        "survey_year": 2021
    },
    # Village: Kalyanpur (Tehsil: Bakshi Ka Talab, District: Lucknow)
    {
        "record_id": "UP-LKO-2024-021",
        "owner_name": "Babu Lal Maurya",
        "father_name": "Raghunath Maurya",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "401/1",
        "khata_no": "201",
        "area_hectares": 1.70,
        "land_type": "Agricultural - Vegetable Farming",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9850,
        "longitude": 80.8920,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-022",
        "owner_name": "Suraj Bhan Rawat",
        "father_name": "Chhotey Lal Rawat",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "401/2",
        "khata_no": "201",
        "area_hectares": 1.10,
        "land_type": "Agricultural - Vegetable Farming",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9862,
        "longitude": 80.8935,
        "survey_year": 2023
    },
    {
        "record_id": "UP-LKO-2024-023",
        "owner_name": "Smt. Shanti Devi",
        "father_name": "W/o Late Munshi Lal",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "402/1",
        "khata_no": "205",
        "area_hectares": 0.60,
        "land_type": "Residential",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9874,
        "longitude": 80.8950,
        "survey_year": 2021
    },
    {
        "record_id": "UP-LKO-2024-024",
        "owner_name": "Ajay Singh Rathore",
        "father_name": "Pratap Singh Rathore",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "403/A",
        "khata_no": "210",
        "area_hectares": 3.80,
        "land_type": "Agricultural - Tube Well Irrigated",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9886,
        "longitude": 80.8965,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-025",
        "owner_name": "Pankaj Srivastava",
        "father_name": "G. C. Srivastava",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "404/2",
        "khata_no": "215",
        "area_hectares": 0.40,
        "land_type": "Industrial - Small Scale",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9898,
        "longitude": 80.8980,
        "survey_year": 2024
    },
    {
        "record_id": "UP-LKO-2024-026",
        "owner_name": "Mohd. Aslam",
        "father_name": "Mohd. Usman",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "405/1",
        "khata_no": "220",
        "area_hectares": 1.25,
        "land_type": "Agricultural",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9910,
        "longitude": 80.8995,
        "survey_year": 2022
    },
    {
        "record_id": "UP-LKO-2024-027",
        "owner_name": "Kamla Prasad Dubey",
        "father_name": "Shiv Balak Dubey",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "406/3",
        "khata_no": "225",
        "area_hectares": 0.72,
        "land_type": "Agricultural",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9922,
        "longitude": 80.9010,
        "survey_year": 2023
    },
    {
        "record_id": "UP-LKO-2024-028",
        "owner_name": "Tara Chand Gautam",
        "father_name": "Bishun Dayal Gautam",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "407/1",
        "khata_no": "230",
        "area_hectares": 2.05,
        "land_type": "Agricultural - Grain Crop",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9934,
        "longitude": 80.9025,
        "survey_year": 2021
    },
    {
        "record_id": "UP-LKO-2024-029",
        "owner_name": "Anita Shukla",
        "father_name": "W/o Manoj Shukla",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "408/A",
        "khata_no": "235",
        "area_hectares": 1.50,
        "land_type": "Agricultural",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9946,
        "longitude": 80.9040,
        "survey_year": 2023
    },
    {
        "record_id": "UP-LKO-2024-030",
        "owner_name": "Rajendra Prasad Nishad",
        "father_name": "Ganga Ram Nishad",
        "village": "Kalyanpur",
        "tehsil": "Bakshi Ka Talab",
        "district": "Lucknow",
        "state": "Uttar Pradesh",
        "khasra_no": "409/2",
        "khata_no": "240",
        "area_hectares": 0.85,
        "land_type": "Fisheries / Pond Adjacent",
        "mutation_status": "MUTATED_VERIFIED",
        "registration_status": "REGISTERED",
        "dispute_status": "CLEAR",
        "latitude": 26.9958,
        "longitude": 80.9055,
        "survey_year": 2022
    }
]

# Initial Cadastral Parcels for Map Visualization (Village: Rampur Cadastral Grid)
INITIAL_CADASTRAL_PARCELS = [
    {
        "khasra_no": "245/1",
        "village": "Rampur",
        "owner_name": "Ramesh Kumar",
        "area_hectares": 0.95,
        "status": "VALID",
        "dispute_flag": False,
        "polygon_points": json.dumps([[100, 100], [240, 100], [240, 220], [100, 220]]),
        "center_x": 170.0,
        "center_y": 160.0,
        "reference_record_id": "UP-LKO-2024-001"
    },
    {
        "khasra_no": "245/2",
        "village": "Rampur",
        "owner_name": "Ramesh Kumar",
        "area_hectares": 1.05,
        "status": "REVIEW_REQUIRED",
        "dispute_flag": False,
        "polygon_points": json.dumps([[250, 100], [390, 100], [390, 220], [250, 220]]),
        "center_x": 320.0,
        "center_y": 160.0,
        "reference_record_id": "UP-LKO-2024-002"
    },
    {
        "khasra_no": "245/3",
        "village": "Rampur",
        "owner_name": "Ramesh Kumar",
        "area_hectares": 1.40,
        "status": "VALID",
        "dispute_flag": False,
        "polygon_points": json.dumps([[400, 100], [550, 100], [550, 220], [400, 220]]),
        "center_x": 475.0,
        "center_y": 160.0,
        "reference_record_id": "UP-LKO-2024-003"
    },
    {
        "khasra_no": "246/1",
        "village": "Rampur",
        "owner_name": "Ramesh Kr.",
        "area_hectares": 0.88,
        "status": "VALID",
        "dispute_flag": False,
        "polygon_points": json.dumps([[100, 230], [240, 230], [240, 350], [100, 350]]),
        "center_x": 170.0,
        "center_y": 290.0,
        "reference_record_id": "UP-LKO-2024-004"
    },
    {
        "khasra_no": "245/7",
        "village": "Rampur",
        "owner_name": "Dinesh Verma",
        "area_hectares": 0.65,
        "status": "HIGH_RISK",
        "dispute_flag": True,
        "polygon_points": json.dumps([[250, 230], [390, 230], [390, 350], [250, 350]]),
        "center_x": 320.0,
        "center_y": 290.0,
        "reference_record_id": "UP-LKO-2024-005"
    },
    {
        "khasra_no": "312/1",
        "village": "Rampur",
        "owner_name": "Vikram Singh",
        "area_hectares": 2.10,
        "status": "HIGH_RISK",
        "dispute_flag": True,
        "polygon_points": json.dumps([[400, 230], [550, 230], [550, 350], [400, 350]]),
        "center_x": 475.0,
        "center_y": 290.0,
        "reference_record_id": "UP-LKO-2024-006"
    },
    {
        "khasra_no": "312/2",
        "village": "Rampur",
        "owner_name": "Sunita Devi",
        "area_hectares": 1.75,
        "status": "VALID",
        "dispute_flag": False,
        "polygon_points": json.dumps([[100, 360], [240, 360], [240, 480], [100, 480]]),
        "center_x": 170.0,
        "center_y": 420.0,
        "reference_record_id": "UP-LKO-2024-007"
    },
    {
        "khasra_no": "108/A",
        "village": "Rampur",
        "owner_name": "Amitabh Sharma",
        "area_hectares": 0.45,
        "status": "VALID",
        "dispute_flag": False,
        "polygon_points": json.dumps([[250, 360], [390, 360], [390, 480], [250, 480]]),
        "center_x": 320.0,
        "center_y": 420.0,
        "reference_record_id": "UP-LKO-2024-008"
    },
    {
        "khasra_no": "109/B",
        "village": "Rampur",
        "owner_name": "Gopal Krishna Yadav",
        "area_hectares": 1.82,
        "status": "VALID",
        "dispute_flag": False,
        "polygon_points": json.dumps([[400, 360], [550, 360], [550, 480], [400, 480]]),
        "center_x": 475.0,
        "center_y": 420.0,
        "reference_record_id": "UP-LKO-2024-009"
    }
]

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if reference records already seeded
        existing_ref = db.query(ReferenceRecord).first()
        if not existing_ref:
            for rec in INITIAL_REFERENCE_RECORDS:
                db.add(ReferenceRecord(**rec))
            db.commit()

        # Check if cadastral parcels already seeded
        existing_parcel = db.query(CadastralParcel).first()
        if not existing_parcel:
            for parcel in INITIAL_CADASTRAL_PARCELS:
                db.add(CadastralParcel(**parcel))
            db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
