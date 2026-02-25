from enum import StrEnum

from pydantic import BaseModel

MAX_DESCRIPTION_LENGTH = 255


class TransactionType(StrEnum):
    income = "income"
    expense = "expense"


class TransactionBase(BaseModel):
    amount: float
    description: str | None
    type: TransactionType


class TransactionCreate(TransactionBase):
    category_id: int


class TransactionResponse(TransactionBase):
    id: int
    category_name: str | None

    class Config:
        from_attributes = True


class BalanceSummary(BaseModel):
    total_balance: float
    total_income: float
    total_expense: float