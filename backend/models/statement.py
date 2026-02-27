import datetime
from sqlalchemy import ForeignKey, Text, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Statement(Base):
    __tablename__ = "statements"

    id: Mapped[int] = mapped_column(primary_key=True)
    upload_date: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.utcnow)
    original_filename: Mapped[str] = mapped_column(Text)
    filepath: Mapped[str] = mapped_column(Text)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(
        SAEnum('pending', 'processing', 'completed', 'failed', name='statement_status'),
        default='pending'
    )

    # Relationships
    instrument: Mapped["Instrument"] = relationship(back_populates="statements")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="statement")

    def json(self):
        return {
            "id": self.id,
            "upload_date": self.upload_date.strftime('%Y-%m-%d %H:%M:%S'),
            "original_filename": self.original_filename,
            "filepath": self.filepath,
            "instrument_id": self.instrument_id,
            "row_count": self.row_count,
            "status": self.status
        }
