import sqlite3
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

def migrate():
    sqlite_conn = sqlite3.connect('peoplepay360.db')
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    # Tables to migrate in dependency order
    table_order = [
        'users',
        'departments',
        'working_schedules',
        'working_schedule_days',
        'time_off_types',
        'salary_structures',
        'salary_rules',
        'employees',
        'contracts',
        'employment_history',
        'attendance_records',
        'time_off_allocations',
        'time_off_requests',
        'payruns',
        'payrun_employees',
        'payslips',
        'payslip_lines'
    ]

    with app.app_context():
        # Clean existing or seed fresh
        for table in table_order:
            try:
                sqlite_cur.execute(f"SELECT * FROM {table}")
                rows = sqlite_cur.fetchall()
                if not rows:
                    continue

                col_names = rows[0].keys()
                cols_str = ", ".join(col_names)
                placeholders = ", ".join([f":{c}" for c in col_names])

                insert_sql = text(f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING")

                for row in rows:
                    data = dict(row)
                    db.session.execute(insert_sql, data)

                db.session.commit()
                print(f"Migrated {len(rows)} rows into {table}")
            except Exception as e:
                db.session.rollback()
                print(f"Skipped/Error on {table}: {e}")

        # Fix sequence IDs for Postgres auto-increment
        seq_tables = [
            ('departments', 'id'),
            ('working_schedules', 'id'),
            ('working_schedule_days', 'id'),
            ('time_off_types', 'id'),
            ('salary_structures', 'id'),
            ('salary_rules', 'id'),
            ('employees', 'id'),
            ('contracts', 'id'),
            ('employment_history', 'id'),
            ('attendance_records', 'id'),
            ('time_off_allocations', 'id'),
            ('time_off_requests', 'id'),
            ('payruns', 'id'),
            ('payrun_employees', 'id'),
            ('payslips', 'id'),
            ('payslip_lines', 'id')
        ]
        for tbl, id_col in seq_tables:
            try:
                seq_query = text(f"SELECT setval(pg_get_serial_sequence('{tbl}', '{id_col}'), coalesce(max({id_col}), 1)) FROM {tbl};")
                db.session.execute(seq_query)
                db.session.commit()
            except Exception as ex:
                db.session.rollback()

    print("MIGRATION_COMPLETE")

if __name__ == '__main__':
    migrate()
