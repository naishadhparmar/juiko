import datetime
from sqlalchemy import ForeignKey, Text, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base
from typing import List

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    transaction_date: Mapped[datetime.datetime]
    posted_date: Mapped[datetime.datetime]
    description: Mapped[str] = mapped_column(Text, nullable=True)
    amount: Mapped[float] = mapped_column(Numeric(11, 2))
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id"))

    # Relationships
    instrument: Mapped["Instrument"] = relationship(back_populates="transactions")
    tags: Mapped[List["TransactionTag"]] = relationship(back_populates="transaction")

    def json(self):
        return {
            "id": self.id,
            "transaction_date": self.transaction_date.strftime('%Y-%m-%d'),
            "posted_date": self.posted_date.strftime('%Y-%m-%d'),
            "description": self.description,
            "amount": float(self.amount),
            "instrument_id": self.instrument_id,
            "instrument": self.instrument.account_name if self.instrument else None,
            "tags": [tag.tag for tag in self.tags]
        }

    def __repr__(self):
        return f"<Transaction id={self.id} description={self.description} amount={self.amount}>"