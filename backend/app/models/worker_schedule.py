from app.database.db import db


class WorkerSchedule(db.Model):
    __tablename__ = "worker_schedules"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    company_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "companies.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    worker_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "workers.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    weekday = db.Column(
        db.Integer,
        nullable=False
    )
    # 0 = domingo
    # 1 = segunda
    # 2 = terça
    # 3 = quarta
    # 4 = quinta
    # 5 = sexta
    # 6 = sábado

    start_time = db.Column(
        db.Time,
        nullable=False
    )

    end_time = db.Column(
        db.Time,
        nullable=False
    )

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    worker = db.relationship(
        "Worker",
        backref=db.backref(
            "schedules",
            cascade="all, delete-orphan",
            lazy=True
        )
    )

    __table_args__ = (
        db.UniqueConstraint(
            "worker_id",
            "weekday",
            name="uq_worker_schedule_weekday"
        ),
    )