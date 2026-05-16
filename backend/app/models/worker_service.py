from app.database.db import db

class WorkerService(db.Model):
    __tablename__ = "worker_services"

    worker_id = db.Column(
        db.Integer,
        db.ForeignKey("workers.id", ondelete="CASCADE"),
        primary_key=True
    )

    service_id = db.Column(
        db.Integer,
        db.ForeignKey("services.id", ondelete="CASCADE"),
        primary_key=True
    )

    created_at = db.Column(
        db.DateTime,
        server_default=db.func.now()
    )