import os
from dotenv import load_dotenv

print('Before load_dotenv:')
print('  ASKSAGE_API_KEY:', os.environ.get('ASKSAGE_API_KEY', 'NOT SET'))

result = load_dotenv('missionpulse_asksage/.env', override=True)
print('load_dotenv returned:', result)

print('After load_dotenv:')
print('  ASKSAGE_API_KEY:', os.environ.get('ASKSAGE_API_KEY', 'NOT SET')[:20] + '...' if os.environ.get('ASKSAGE_API_KEY') else 'NOT SET')
print('  ASKSAGE_EMAIL:', os.environ.get('ASKSAGE_EMAIL', 'NOT SET'))
print('  ASKSAGE_ENVIRONMENT:', os.environ.get('ASKSAGE_ENVIRONMENT', 'NOT SET'))
