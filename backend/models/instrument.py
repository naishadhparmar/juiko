from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from typing import List

class Instrument(Base):
    __tablename__ = "instruments"

    id: Mapped[int] = mapped_column(primary_key=True)
    financial_institution: Mapped[str] = mapped_column(Text)
    account_name: Mapped[str] = mapped_column(Text)
    type: Mapped[int] = mapped_column(ForeignKey("instrument_types.id"))

    # Relationships
    instrument_type: Mapped["InstrumentType"] = relationship(back_populates="instruments")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="instrument")
    statements: Mapped[List["Statement"]] = relationship(back_populates="instrument")

    def json(self):
        return {
            "id": self.id,
            "financial_institution": self.financial_institution,
            "account_name": self.account_name,
            "type": self.type,
            "transaction_count": len(self.transactions)
        }

    def __repr__(self):
        return f"<Instrument id={self.id} financial_institution={self.financial_institution} account_name={self.account_name} type={self.type}>"