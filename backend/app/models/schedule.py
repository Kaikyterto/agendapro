from app.database.db import db


class Schedule(db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    worker_id = db.Column(
        db.Integer,
        db.ForeignKey("workers.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    service_id = db.Column(
        db.Integer,
        db.ForeignKey("services.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

  
    start_time = db.Column(db.DateTime, nullable=False, index=True)
    end_time = db.Column(db.DateTime, nullable=False, index=True)

   
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False)

    notes = db.Column(db.Text, nullable=True)

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
        nullable=False
    )

    
    service = db.relationship(
        "Service",
        backref=db.backref("schedule", lazy=True)
    )

    worker = db.relationship(
        "Worker",
        backref=db.backref("schedule", lazy=True)
    )