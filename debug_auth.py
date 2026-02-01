import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv('missionpulse_asksage/.env')

async def debug_auth():
    api_key = os.environ.get('ASKSAGE_API_KEY')
    email = os.environ.get('ASKSAGE_EMAIL')
    print(f'API Key: {api_key[:20]}...')
    print(f'Email: {email}')
    
    async with httpx.AsyncClient() as client:
        # Test token endpoint
        resp = await client.post(
            'https://api.asksage.ai/user/get-token-with-api-key',
            json={'email': email, 'api_key': api_key}
        )
        print(f'Status: {resp.status_code}')
        print(f'Response: {resp.text}')

asyncio.run(debug_auth())
