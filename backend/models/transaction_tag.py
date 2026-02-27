from sqlalchemy import ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class TransactionTag(Base):
    __tablename__ = "transaction_tags"

    transaction_id: Mapped[int] = mapped_column(ForeignKey("transactions.id"), primary_key=True)
    tag: Mapped[str] = mapped_column(Text, primary_key=True)
    source: Mapped[str] = mapped_column(
        SAEnum('manual', 'ai', name='tag_source'),
        default='manual'
    )

    # Relationship back to the transaction
    transaction: Mapped["Transaction"] = relationship(back_populates="tags")

    def json(self):
        return {
            "transaction_id": self.transaction_id,
            "tag": self.tag,
            "source": self.source
        }
