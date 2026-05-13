from app.database.db import db


class Schedule(db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)

    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    # Slot escolhido (horário)
    slot_id = db.Column(
        db.Integer,
        db.ForeignKey("time_slots.id"),
        nullable=False,
        unique=True
    )

    service_id = db.Column(
        db.Integer,
        db.ForeignKey("services.id"),
        nullable=False
    )

    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)

    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending"
    )

    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now()
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        server_default=db.func.now(),
        onupdate=db.func.now()
    )

    slot = db.relationship(
        "TimeSlot",
        backref=db.backref("schedule", uselist=False)
    )

    service = db.relationship(
        "Service",
        backref=db.backref("schedules", lazy=True)
    )