from sqlalchemy import Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from typing import List

class InstrumentType(Base):
    __tablename__ = "instrument_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    type_name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    # Relationship to Instruments
    instruments: Mapped[List["Instrument"]] = relationship(back_populates="instrument_type")

    def get_id(self) -> int:
        return self.id

    def get_type_name(self) -> str:
        return self.type_name

    def json(self):
        return {
            "id": self.id,
            "type_name": self.type_name
        }
    
    def __repr__(self):
        return f"<id={self.id} type_name={self.type_name}>"