from app.database.db import db

class TimeSlot(db.Model):
    __tablename__ = "time_slots"

    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True)
    worker_id = db.Column(
    db.Integer,
    db.ForeignKey("workers.id"),
    nullable=True
)
    
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    
    is_available = db.Column(db.Boolean, default=True)
    price = db.Column(db.Float, nullable=True) # Caso o horário tenha preço diferente

   
    company = db.relationship('Company', backref=db.backref('slots', lazy=True))
    worker = db.relationship('Worker', backref=db.backref('slots', lazy=True))