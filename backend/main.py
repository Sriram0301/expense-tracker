from datetime import date, datetime

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Response,
    status
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import engine, Base, SessionLocal
from backend import models

from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

security = HTTPBearer()
class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=50
    )

    email: str

    password: str = Field(
        min_length=6,
        max_length=100
    )
class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

class Config:
    from_attributes = True


# -------------------------
# Database connection
# -------------------------

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
)

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user = db.query(models.User).filter(
        models.User.id == int(user_id)
    ).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user

@app.get("/me", response_model=UserResponse)
def get_me(
    current_user: models.User = Depends(get_current_user)
):
    return current_user

# -------------------------
# Pydantic Models
# -------------------------

class ExpenseCreate(BaseModel):

    category: str = Field(
        min_length=2,
        max_length=50
    )

    description: str = Field(
        min_length=2,
        max_length=200
    )

    amount: float = Field(
        gt=0
    )

    expense_date: date



class ExpenseResponse(BaseModel):

    id: int
    category: str
    description: str
    amount: float
    expense_date: date
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------
# Home
# -------------------------

@app.get("/")
def home():
    return {
        "message": "Expense Tracker API is running!"
    }


# -------------------------
# GET all expenses
# -------------------------
@app.get("/expenses", response_model=list[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id
    ).all()

# -------------------------
# GET one expense
# -------------------------

@app.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    return expense

# -------------------------
# POST expense
# -------------------------

@app.post(
    "/expenses",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED
)
def add_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_expense = models.Expense(
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        expense_date=expense.expense_date,
        user_id=current_user.id
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense

# -------------------------
# GET total
# -------------------------

@app.get("/total")
def get_total(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expenses = db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id
    ).all()

    total = sum(expense.amount for expense in expenses)

    return {"total": total}


# -------------------------
# PUT expense
# -------------------------

@app.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    updated_expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    expense.category = updated_expense.category
    expense.description = updated_expense.description
    expense.amount = updated_expense.amount
    expense.expense_date = updated_expense.expense_date

    db.commit()
    db.refresh(expense)

    return expense

# -------------------------
# DELETE expense
# -------------------------

@app.delete(
    "/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    hashed_password = hash_password(user.password)

    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/login")
def login_user(
    user: LoginRequest,
    db: Session = Depends(get_db)
):
    # Find the user using email
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    # If user doesn't exist
    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check the password
    password_correct = verify_password(
        user.password,
        existing_user.password
    )

    # If password is wrong
    if not password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token(
        data={"sub": str(existing_user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }