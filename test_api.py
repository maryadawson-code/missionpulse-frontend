import asyncio
from dotenv import load_dotenv
load_dotenv('missionpulse_asksage/.env')

from missionpulse_asksage.asksage_client import AskSageClient

async def test():
    c = AskSageClient()
    r = await c.query('What is 2+2? Reply with just the number.', 'capture', model='gpt-4o-mini')
    print('Response:', r.content)
    print('Model:', r.model)
    print('Cost USD:', r.estimated_cost)
    await c.close()

asyncio.run(test())
