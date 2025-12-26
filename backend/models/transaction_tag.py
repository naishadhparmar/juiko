from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class TransactionTag(Base):
    __tablename__ = "transaction_tags"

    transaction_id: Mapped[int] = mapped_column(ForeignKey("transactions.id"), primary_key=True)
    tag: Mapped[str] = mapped_column(Text, primary_key=True)

    # Relationship back to the transaction
    transaction: Mapped["Transaction"] = relationship(back_populates="tags")

    def json(self):
        return {
            "transaction_id": self.id,
            "tag": self.tag
        }
