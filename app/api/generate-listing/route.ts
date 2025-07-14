import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // This is a placeholder for the actual implementation
    // In the next steps, I will add the logic to call the OpenAI API
    // and perform the web searches and data extraction.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a real estate assistant. Your task is to find information about a property at a given address from Zillow, Redfin, and Realtor.com.
          You need to extract the number of bedrooms, bathrooms, and square footage.
          Compare the information from the three sources. If there are discrepancies, use the information from Zillow.
          Then, create a compelling property title and a renter-focused property description.
          The description should highlight the property's features and amenities that are attractive to renters.
          Do not include any information about financing or buying the property.
          Return the information in a JSON object with the following keys: "title", "beds", "baths", "sqft", "description".
          The final output must be a valid JSON object and nothing else.`
        },
        {
          role: 'user',
          content: `Address: ${address}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      return NextResponse.json({ error: 'Failed to generate listing details' }, { status: 500 });
    }

    const parsedResult = JSON.parse(result);

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error generating listing details:', error);
    return NextResponse.json({ error: 'Failed to generate listing details' }, { status: 500 });
  }
}
