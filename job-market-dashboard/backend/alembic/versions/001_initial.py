"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Skill Categories
    op.create_table(
        'skill_categories',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_skill_categories_name', 'skill_categories', ['name'])

    # Skills
    op.create_table(
        'skills',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('normalized_name', sa.String(200), nullable=False),
        sa.Column('display_name', sa.String(200), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('is_hard_skill', sa.Boolean(), default=True),
        sa.Column('aliases', sa.Text(), nullable=True),
        sa.Column('total_mentions', sa.Integer(), default=0),
        sa.Column('required_mentions', sa.Integer(), default=0),
        sa.Column('preferred_mentions', sa.Integer(), default=0),
        sa.Column('first_seen', sa.DateTime(), nullable=True),
        sa.Column('last_seen', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['skill_categories.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_skills_name', 'skills', ['name'])
    op.create_index('ix_skills_normalized_name', 'skills', ['normalized_name'])
    op.create_index('ix_skill_mentions', 'skills', ['total_mentions'])

    # Certifications
    op.create_table(
        'certifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(300), nullable=False),
        sa.Column('normalized_name', sa.String(300), nullable=False),
        sa.Column('display_name', sa.String(300), nullable=False),
        sa.Column('acronym', sa.String(50), nullable=True),
        sa.Column('provider', sa.String(200), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('aliases', sa.Text(), nullable=True),
        sa.Column('total_mentions', sa.Integer(), default=0),
        sa.Column('required_mentions', sa.Integer(), default=0),
        sa.Column('preferred_mentions', sa.Integer(), default=0),
        sa.Column('first_seen', sa.DateTime(), nullable=True),
        sa.Column('last_seen', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('ix_certifications_name', 'certifications', ['name'])
    op.create_index('ix_certifications_acronym', 'certifications', ['acronym'])
    op.create_index('ix_cert_mentions', 'certifications', ['total_mentions'])

    # Job Postings
    op.create_table(
        'job_postings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('external_id', sa.String(255), nullable=False),
        sa.Column('source', sa.String(50), nullable=False),
        sa.Column('url', sa.Text(), nullable=True),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('company', sa.String(255), nullable=False),
        sa.Column('company_size', sa.String(50), nullable=True),
        sa.Column('company_type', sa.String(100), nullable=True),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('work_type', sa.Enum('remote', 'hybrid', 'onsite', 'unknown', name='worktype'), nullable=True),
        sa.Column('category', sa.Enum(
            'software_engineering', 'data_science', 'data_engineering', 'machine_learning',
            'devops', 'product_management', 'design', 'marketing', 'sales', 'finance',
            'hr', 'operations', 'legal', 'consulting', 'healthcare', 'other',
            name='jobcategory'
        ), nullable=True),
        sa.Column('seniority', sa.Enum(
            'intern', 'junior', 'mid', 'senior', 'lead', 'staff',
            'principal', 'director', 'vp', 'executive', 'unknown',
            name='senioritylevel'
        ), nullable=True),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('degree_required', sa.Enum(
            'none_required', 'high_school', 'associate', 'bachelor',
            'master', 'mba', 'phd', 'professional', 'unknown',
            name='degreelevel'
        ), nullable=True),
        sa.Column('degree_preferred', sa.Enum(
            'none_required', 'high_school', 'associate', 'bachelor',
            'master', 'mba', 'phd', 'professional', 'unknown',
            name='degreelevel'
        ), nullable=True),
        sa.Column('specific_degrees', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('universities_mentioned', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('years_experience_min', sa.Integer(), nullable=True),
        sa.Column('years_experience_max', sa.Integer(), nullable=True),
        sa.Column('salary_min', sa.Float(), nullable=True),
        sa.Column('salary_max', sa.Float(), nullable=True),
        sa.Column('salary_currency', sa.String(10), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('requirements_text', sa.Text(), nullable=True),
        sa.Column('raw_data', postgresql.JSONB(), nullable=True),
        sa.Column('posted_date', sa.DateTime(), nullable=True),
        sa.Column('scraped_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('external_id')
    )
    op.create_index('ix_job_postings_external_id', 'job_postings', ['external_id'])
    op.create_index('ix_job_postings_source', 'job_postings', ['source'])
    op.create_index('ix_job_postings_title', 'job_postings', ['title'])
    op.create_index('ix_job_postings_company', 'job_postings', ['company'])
    op.create_index('ix_job_postings_country', 'job_postings', ['country'])
    op.create_index('ix_job_postings_work_type', 'job_postings', ['work_type'])
    op.create_index('ix_job_postings_category', 'job_postings', ['category'])
    op.create_index('ix_job_postings_seniority', 'job_postings', ['seniority'])
    op.create_index('ix_job_postings_posted_date', 'job_postings', ['posted_date'])
    op.create_index('ix_job_postings_scraped_at', 'job_postings', ['scraped_at'])

    # Job-Skills Association
    op.create_table(
        'job_skills',
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('skill_id', sa.Integer(), nullable=False),
        sa.Column('is_required', sa.Boolean(), default=True),
        sa.Column('extracted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['job_postings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('job_id', 'skill_id')
    )

    # Job-Certifications Association
    op.create_table(
        'job_certifications',
        sa.Column('job_id', sa.Integer(), nullable=False),
        sa.Column('certification_id', sa.Integer(), nullable=False),
        sa.Column('is_required', sa.Boolean(), default=False),
        sa.Column('extracted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['job_id'], ['job_postings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['certification_id'], ['certifications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('job_id', 'certification_id')
    )

    # Skill Trends
    op.create_table(
        'skill_trends',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('skill_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_mentions', sa.Integer(), default=0),
        sa.Column('required_mentions', sa.Integer(), default=0),
        sa.Column('preferred_mentions', sa.Integer(), default=0),
        sa.Column('unique_companies', sa.Integer(), default=0),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('seniority', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_skill_trends_skill_id', 'skill_trends', ['skill_id'])
    op.create_index('ix_skill_trends_date', 'skill_trends', ['date'])

    # Certification Trends
    op.create_table(
        'certification_trends',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('certification_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_mentions', sa.Integer(), default=0),
        sa.Column('required_mentions', sa.Integer(), default=0),
        sa.Column('preferred_mentions', sa.Integer(), default=0),
        sa.Column('unique_companies', sa.Integer(), default=0),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['certification_id'], ['certifications.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_certification_trends_cert_id', 'certification_trends', ['certification_id'])
    op.create_index('ix_certification_trends_date', 'certification_trends', ['date'])

    # Degree Distribution
    op.create_table(
        'degree_distributions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('degree_level', sa.String(50), nullable=False),
        sa.Column('required_count', sa.Integer(), default=0),
        sa.Column('preferred_count', sa.Integer(), default=0),
        sa.Column('percentage', sa.Float(), default=0.0),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_degree_distributions_date', 'degree_distributions', ['date'])

    # University Mentions
    op.create_table(
        'university_mentions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('university_name', sa.String(200), nullable=False),
        sa.Column('normalized_name', sa.String(200), nullable=False),
        sa.Column('tier', sa.String(50), nullable=True),
        sa.Column('country', sa.String(100), nullable=True),
        sa.Column('total_mentions', sa.Integer(), default=0),
        sa.Column('first_seen', sa.DateTime(), nullable=True),
        sa.Column('last_seen', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_university_mentions_name', 'university_mentions', ['university_name'])

    # Scrape Logs
    op.create_table(
        'scrape_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('source', sa.String(50), nullable=False),
        sa.Column('search_query', sa.String(500), nullable=True),
        sa.Column('job_category', sa.String(100), nullable=True),
        sa.Column('location', sa.String(200), nullable=True),
        sa.Column('status', sa.Enum('pending', 'running', 'completed', 'failed', 'partial', name='scrapestatus'), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('pages_scraped', sa.Integer(), default=0),
        sa.Column('jobs_found', sa.Integer(), default=0),
        sa.Column('jobs_new', sa.Integer(), default=0),
        sa.Column('jobs_updated', sa.Integer(), default=0),
        sa.Column('skills_extracted', sa.Integer(), default=0),
        sa.Column('certs_extracted', sa.Integer(), default=0),
        sa.Column('requests_made', sa.Integer(), default=0),
        sa.Column('rate_limited', sa.Boolean(), default=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('triggered_by', sa.String(50), default='scheduler'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_scrape_logs_source', 'scrape_logs', ['source'])
    op.create_index('ix_scrape_logs_status', 'scrape_logs', ['status'])


def downgrade() -> None:
    op.drop_table('scrape_logs')
    op.drop_table('university_mentions')
    op.drop_table('degree_distributions')
    op.drop_table('certification_trends')
    op.drop_table('skill_trends')
    op.drop_table('job_certifications')
    op.drop_table('job_skills')
    op.drop_table('job_postings')
    op.drop_table('certifications')
    op.drop_table('skills')
    op.drop_table('skill_categories')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS scrapestatus')
    op.execute('DROP TYPE IF EXISTS degreelevel')
    op.execute('DROP TYPE IF EXISTS senioritylevel')
    op.execute('DROP TYPE IF EXISTS jobcategory')
    op.execute('DROP TYPE IF EXISTS worktype')
