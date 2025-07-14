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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a real estate assistant. Based on the provided address, generate realistic property details and create a compelling renter-focused description.

          Analyze the address and provide:
          1. Estimated number of bedrooms (1-4, based on area type)
          2. Estimated number of bathrooms (1-3, logical for the bedroom count)
          3. Estimated square footage (realistic for the property type and location)
          4. A compelling property description for renters

          The description should:
          - Highlight attractive features for renters
          - Mention neighborhood benefits if applicable
          - Focus on practical amenities and space
          - Avoid buyer-focused information like financing
          - Be 2-3 sentences long and engaging

          You must respond with ONLY a valid JSON object in this exact format:
          {
            "title": "Attractive property title",
            "beds": "2",
            "baths": "1.5",
            "sqft": "1200",
            "description": "Your description here"
          }

          Do not include any other text or explanations.`
        },
        {
          role: 'user',
          content: `Generate property details for: ${address}`
        }
      ],
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      return NextResponse.json({ error: 'Failed to generate listing details' }, { status: 500 });
    }

    // Clean the result to ensure it's valid JSON
    const cleanedResult = result.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw result:', result);
      
      // Fallback: create a default response
      parsedResult = {
        title: "Beautiful Property for Rent",
        beds: "2",
        baths: "1",
        sqft: "1000",
        description: "Lovely property in a great location with modern amenities and convenient access to local attractions."
      };
    }

    // Validate the response has the required fields
    if (!parsedResult.title || !parsedResult.beds || !parsedResult.baths || !parsedResult.sqft || !parsedResult.description) {
      return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
    }

    return NextResponse.json(parsedResult);
  } catch (error) {
    console.error('Error generating listing details:', error);
    return NextResponse.json({ 
      error: 'Failed to generate listing details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
