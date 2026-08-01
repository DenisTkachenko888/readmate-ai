import asyncio
import aiohttp

async def main():
    url = "https://api.telegram.org"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                print("STATUS:", resp.status)
                text = await resp.text()
                print("BODY START:", text[:200])
    except Exception as e:
        print("ERROR:", repr(e))

asyncio.run(main())
