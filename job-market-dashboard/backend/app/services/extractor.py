"""
Skill and certification extraction from job descriptions.

Uses a combination of:
- Pattern matching for known skills/certifications
- NLP (spaCy) for entity extraction
- Regular expressions for structured data
"""
import re
import json
import logging
from typing import Dict, List, Any, Set, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class SkillExtractor:
    """
    Extracts skills, certifications, degree requirements, and universities
    from job description text.

    This uses pattern matching which is fast and reliable for known entities.
    For production, consider adding a trained NER model for unknown skills.
    """

    def __init__(self):
        self._skills_db = self._load_skills_database()
        self._certs_db = self._load_certifications_database()
        self._degree_patterns = self._compile_degree_patterns()
        self._university_patterns = self._compile_university_patterns()

    def extract(self, text: str) -> Dict[str, Any]:
        """
        Extract all entities from text.

        Args:
            text: Job description or requirements text

        Returns:
            Dictionary with extracted entities
        """
        if not text:
            return {
                "skills": [],
                "certifications": [],
                "degree_required": None,
                "degree_preferred": None,
                "universities": [],
                "years_experience": None,
            }

        text_lower = text.lower()

        return {
            "skills": self._extract_skills(text_lower),
            "certifications": self._extract_certifications(text_lower),
            "degree_required": self._extract_degree(text_lower, required=True),
            "degree_preferred": self._extract_degree(text_lower, required=False),
            "universities": self._extract_universities(text_lower),
            "years_experience": self._extract_experience(text_lower),
        }

    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from text."""
        found_skills = set()

        for skill, variants in self._skills_db.items():
            # Check main skill name
            if self._word_match(skill.lower(), text):
                found_skills.add(skill)
                continue

            # Check variants/aliases
            for variant in variants:
                if self._word_match(variant.lower(), text):
                    found_skills.add(skill)  # Use canonical name
                    break

        return sorted(list(found_skills))

    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications from text."""
        found_certs = set()

        for cert, data in self._certs_db.items():
            # Check full name
            if cert.lower() in text:
                found_certs.add(cert)
                continue

            # Check acronym
            acronym = data.get("acronym", "")
            if acronym and self._word_match(acronym.lower(), text):
                found_certs.add(cert)
                continue

            # Check aliases
            for alias in data.get("aliases", []):
                if alias.lower() in text:
                    found_certs.add(cert)
                    break

        return sorted(list(found_certs))

    def _extract_degree(self, text: str, required: bool = True) -> Optional[str]:
        """Extract degree requirements."""
        # Context patterns
        if required:
            context_patterns = [
                r"required.*?(bachelor|master|phd|mba|associate|degree)",
                r"must have.*?(bachelor|master|phd|mba|associate|degree)",
                r"(bachelor|master|phd|mba|associate).*?required",
                r"minimum.*?(bachelor|master|phd|mba|associate)",
            ]
        else:
            context_patterns = [
                r"preferred.*?(bachelor|master|phd|mba|associate|degree)",
                r"(bachelor|master|phd|mba|associate).*?preferred",
                r"nice to have.*?(bachelor|master|phd|mba|associate)",
            ]

        for pattern in context_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return self._normalize_degree(match.group(1))

        # General degree detection (for required only)
        if required:
            for pattern, degree in self._degree_patterns.items():
                if re.search(pattern, text, re.IGNORECASE):
                    return degree

        # Check for "degree not required"
        if required and re.search(r"degree\s+(not|isn.t)\s+required", text, re.IGNORECASE):
            return "none_required"

        return None

    def _extract_universities(self, text: str) -> List[str]:
        """Extract mentioned universities."""
        found = set()

        for pattern, universities in self._university_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                found.update(universities)

        return sorted(list(found))

    def _extract_experience(self, text: str) -> Optional[Dict[str, int]]:
        """Extract years of experience requirements."""
        patterns = [
            r"(\d+)\+?\s*(?:to|-)\s*(\d+)\s*years?\s*(?:of\s+)?experience",
            r"(\d+)\+?\s*years?\s*(?:of\s+)?experience",
            r"minimum\s*(?:of\s+)?(\d+)\s*years?",
            r"at\s+least\s+(\d+)\s*years?",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 2 and groups[1]:
                    return {"min": int(groups[0]), "max": int(groups[1])}
                else:
                    years = int(groups[0])
                    return {"min": years, "max": years + 2}

        return None

    def _word_match(self, word: str, text: str) -> bool:
        """Check if word exists as a whole word in text."""
        # Use word boundaries for accurate matching
        pattern = rf"\b{re.escape(word)}\b"
        return bool(re.search(pattern, text, re.IGNORECASE))

    def _normalize_degree(self, degree_text: str) -> str:
        """Normalize degree text to enum value."""
        degree_text = degree_text.lower()

        mapping = {
            "bachelor": "bachelor",
            "bs": "bachelor",
            "ba": "bachelor",
            "b.s": "bachelor",
            "b.a": "bachelor",
            "master": "master",
            "ms": "master",
            "ma": "master",
            "m.s": "master",
            "phd": "phd",
            "ph.d": "phd",
            "doctorate": "phd",
            "mba": "mba",
            "associate": "associate",
        }

        for pattern, normalized in mapping.items():
            if pattern in degree_text:
                return normalized

        return "unknown"

    def _load_skills_database(self) -> Dict[str, List[str]]:
        """Load skills database with aliases."""
        # This would typically be loaded from a file or database
        # Using inline data for MVP
        return {
            # Programming Languages
            "Python": ["python3", "python 3", "py"],
            "JavaScript": ["js", "ecmascript", "es6", "es2015"],
            "TypeScript": ["ts"],
            "Java": [],
            "C++": ["cpp", "c plus plus"],
            "C#": ["csharp", "c sharp", ".net"],
            "Go": ["golang"],
            "Rust": [],
            "Ruby": [],
            "PHP": [],
            "Swift": [],
            "Kotlin": [],
            "Scala": [],
            "R": [],

            # Web Frameworks
            "React": ["react.js", "reactjs"],
            "Next.js": ["nextjs", "next js"],
            "Vue.js": ["vue", "vuejs"],
            "Angular": ["angularjs"],
            "Node.js": ["nodejs", "node"],
            "Express.js": ["express", "expressjs"],
            "Django": [],
            "Flask": [],
            "FastAPI": ["fast api"],
            "Spring Boot": ["spring", "spring framework"],
            "Ruby on Rails": ["rails", "ror"],
            "Laravel": [],

            # Databases
            "PostgreSQL": ["postgres", "psql"],
            "MySQL": [],
            "MongoDB": ["mongo"],
            "Redis": [],
            "Elasticsearch": ["elastic search", "es"],
            "DynamoDB": ["dynamo db", "dynamodb"],
            "Cassandra": [],
            "SQLite": [],
            "Oracle": ["oracle db"],
            "SQL Server": ["mssql", "microsoft sql"],

            # Cloud & Infrastructure
            "AWS": ["amazon web services", "amazon aws"],
            "Azure": ["microsoft azure"],
            "GCP": ["google cloud", "google cloud platform"],
            "Docker": [],
            "Kubernetes": ["k8s"],
            "Terraform": [],
            "Ansible": [],
            "Jenkins": [],
            "GitHub Actions": ["gh actions"],
            "CircleCI": ["circle ci"],
            "GitLab CI": ["gitlab ci/cd"],

            # Data & ML
            "TensorFlow": ["tf"],
            "PyTorch": ["pytorch"],
            "Scikit-learn": ["sklearn", "scikit learn"],
            "Pandas": [],
            "NumPy": ["numpy"],
            "Apache Spark": ["spark", "pyspark"],
            "Apache Kafka": ["kafka"],
            "Apache Airflow": ["airflow"],
            "Snowflake": [],
            "Databricks": [],
            "dbt": ["data build tool"],
            "Tableau": [],
            "Power BI": ["powerbi"],
            "Looker": [],

            # Other Technical
            "GraphQL": ["graphql"],
            "REST API": ["restful", "rest apis"],
            "gRPC": [],
            "Microservices": ["micro services"],
            "Linux": ["unix"],
            "Git": [],
            "CI/CD": ["cicd", "ci cd"],
            "Agile": ["scrum"],
            "DevOps": [],
            "MLOps": [],
            "DataOps": [],

            # Soft Skills
            "Leadership": ["lead teams", "team leadership"],
            "Communication": ["communicate effectively"],
            "Problem Solving": ["problem-solving"],
            "Collaboration": ["collaborative", "cross-functional"],
            "Mentoring": ["mentor", "mentorship"],
        }

    def _load_certifications_database(self) -> Dict[str, Dict[str, Any]]:
        """Load certifications database."""
        return {
            # AWS
            "AWS Solutions Architect Associate": {
                "acronym": "SAA-C03",
                "aliases": ["aws saa", "solutions architect associate"],
                "provider": "AWS"
            },
            "AWS Solutions Architect Professional": {
                "acronym": "SAP-C02",
                "aliases": ["aws sap", "solutions architect professional"],
                "provider": "AWS"
            },
            "AWS Developer Associate": {
                "acronym": "DVA-C02",
                "aliases": ["aws dva", "aws developer"],
                "provider": "AWS"
            },
            "AWS DevOps Engineer Professional": {
                "acronym": "DOP-C02",
                "aliases": ["aws devops"],
                "provider": "AWS"
            },

            # Google Cloud
            "Google Cloud Professional Cloud Architect": {
                "acronym": "GCP-PCA",
                "aliases": ["gcp cloud architect", "google cloud architect"],
                "provider": "Google"
            },
            "Google Cloud Professional Data Engineer": {
                "acronym": "GCP-PDE",
                "aliases": ["gcp data engineer"],
                "provider": "Google"
            },

            # Azure
            "Azure Administrator Associate": {
                "acronym": "AZ-104",
                "aliases": ["azure admin"],
                "provider": "Microsoft"
            },
            "Azure Solutions Architect Expert": {
                "acronym": "AZ-305",
                "aliases": ["azure architect"],
                "provider": "Microsoft"
            },
            "Azure Developer Associate": {
                "acronym": "AZ-204",
                "aliases": ["azure developer"],
                "provider": "Microsoft"
            },

            # Kubernetes
            "Certified Kubernetes Administrator": {
                "acronym": "CKA",
                "aliases": ["kubernetes admin"],
                "provider": "CNCF"
            },
            "Certified Kubernetes Application Developer": {
                "acronym": "CKAD",
                "aliases": ["kubernetes developer"],
                "provider": "CNCF"
            },

            # Security
            "CISSP": {
                "acronym": "CISSP",
                "aliases": ["certified information systems security professional"],
                "provider": "ISC2"
            },
            "Security+": {
                "acronym": "Security+",
                "aliases": ["comptia security+", "comptia security plus"],
                "provider": "CompTIA"
            },
            "CEH": {
                "acronym": "CEH",
                "aliases": ["certified ethical hacker"],
                "provider": "EC-Council"
            },

            # Project Management
            "PMP": {
                "acronym": "PMP",
                "aliases": ["project management professional"],
                "provider": "PMI"
            },
            "Certified Scrum Master": {
                "acronym": "CSM",
                "aliases": ["scrum master certification"],
                "provider": "Scrum Alliance"
            },
            "Professional Scrum Master": {
                "acronym": "PSM",
                "aliases": ["psm i", "psm ii"],
                "provider": "Scrum.org"
            },

            # Data
            "Databricks Certified Data Engineer": {
                "acronym": "DCE",
                "aliases": ["databricks data engineer"],
                "provider": "Databricks"
            },
            "Snowflake SnowPro Core": {
                "acronym": "SnowPro",
                "aliases": ["snowflake certification"],
                "provider": "Snowflake"
            },

            # Other
            "Terraform Associate": {
                "acronym": "TFA",
                "aliases": ["hashicorp terraform"],
                "provider": "HashiCorp"
            },
        }

    def _compile_degree_patterns(self) -> Dict[str, str]:
        """Compile regex patterns for degree detection."""
        return {
            r"\bphd\b|\bph\.d\b|\bdoctorate\b": "phd",
            r"\bmba\b|\bm\.b\.a\b": "mba",
            r"\bmaster'?s?\b|\bms\b|\bm\.s\b|\bma\b|\bm\.a\b": "master",
            r"\bbachelor'?s?\b|\bbs\b|\bb\.s\b|\bba\b|\bb\.a\b|\bundergr": "bachelor",
            r"\bassociate'?s?\b|\ba\.s\b|\ba\.a\b": "associate",
            r"\bhigh school\b|\bged\b": "high_school",
        }

    def _compile_university_patterns(self) -> Dict[str, List[str]]:
        """Compile patterns for university detection."""
        return {
            r"\bivy league\b": ["Harvard", "Yale", "Princeton", "Columbia", "Penn", "Brown", "Cornell", "Dartmouth"],
            r"\bstanford\b": ["Stanford"],
            r"\bmit\b": ["MIT"],
            r"\bharvard\b": ["Harvard"],
            r"\bcarnegie mellon\b|\bcmu\b": ["Carnegie Mellon"],
            r"\bberkeley\b|\buc berkeley\b": ["UC Berkeley"],
            r"\bgeorgia tech\b": ["Georgia Tech"],
            r"\boxford\b": ["Oxford"],
            r"\bcambridge\b": ["Cambridge"],
            r"\brussell group\b": ["Russell Group Universities"],
            r"\btop.{0,10}universit": ["Top University"],
        }


class BatchExtractor:
    """Batch processing for large-scale extraction."""

    def __init__(self):
        self.extractor = SkillExtractor()

    def extract_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Extract from multiple texts."""
        return [self.extractor.extract(text) for text in texts]

    def get_skill_frequencies(self, texts: List[str]) -> Dict[str, int]:
        """Get skill frequencies across multiple job descriptions."""
        frequencies = {}
        for text in texts:
            result = self.extractor.extract(text)
            for skill in result["skills"]:
                frequencies[skill] = frequencies.get(skill, 0) + 1
        return dict(sorted(frequencies.items(), key=lambda x: x[1], reverse=True))
