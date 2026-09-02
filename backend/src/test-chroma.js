require("dotenv").config();

const { CloudClient } = require("chromadb");

async function testChroma() {
  try {
    const client = new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT,
      database: process.env.CHROMA_DATABASE || "ritesh",
    });

    const heartbeat = await client.heartbeat();

    console.log("Chroma Cloud connected successfully!");
    console.log("Heartbeat:", heartbeat);
  } catch (error) {
    console.error("Chroma Cloud connection failed:");
    console.error(error);
  }
}

testChroma();