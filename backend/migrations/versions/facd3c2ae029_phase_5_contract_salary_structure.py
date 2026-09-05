"""phase 5: contract salary structure

Revision ID: facd3c2ae029
Revises: 00b8f1f34ec1
Create Date: 2026-09-05 15:45:13.735923

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'facd3c2ae029'
down_revision: Union[str, None] = '00b8f1f34ec1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('contracts', sa.Column('salary_structure_id', sa.Uuid(), nullable=True))
    op.create_index(op.f('ix_contracts_salary_structure_id'), 'contracts', ['salary_structure_id'], unique=False)
    op.create_foreign_key('fk_contracts_salary_structure_id', 'contracts', 'salary_structures', ['salary_structure_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_contracts_salary_structure_id', 'contracts', type_='foreignkey')
    op.drop_index(op.f('ix_contracts_salary_structure_id'), table_name='contracts')
    op.drop_column('contracts', 'salary_structure_id')
