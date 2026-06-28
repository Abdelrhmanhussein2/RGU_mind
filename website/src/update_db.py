from helpers.config import engine, Base
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('DROP TABLE IF EXISTS student_profiles CASCADE;'))
    conn.commit()

Base.metadata.create_all(bind=engine)
print('Updated successfully!')
