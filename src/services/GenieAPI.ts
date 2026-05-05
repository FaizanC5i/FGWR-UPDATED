export async function askGenie(prompt: string): Promise<string> {
  const BASE_URL =
  "https://genieaiapp-c9bzctfne5budhff.eastus-01.azurewebsites.net/api";
  
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  try {
    const res = await fetch(
      `${BASE_URL}/genieaiapp?prompt=${encodeURIComponent(prompt)}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      throw new Error(`Genie API failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Genie raw response:", data);

    // Handle different response structures
    if (data.text) {
      return data.text;
    } else if (data.response) {
      return data.response;
    } else if (data.result) {
      return data.result;
    } else if (data.message) {
      return data.message;
    } else if (typeof data === 'string') {
      return data;
    } else if (data.data) {
      // Check if there's nested data
      return typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
    }
    
    // If none of the above, check if response has any content
    const keys = Object.keys(data);
    if (keys.length > 0) {
      console.warn("Unexpected response structure. Available keys:", keys);
      // Return the first available value or stringify the whole object
      return data[keys[0]] || JSON.stringify(data);
    }
    
    throw new Error("No data or text returned from API");
    
  } catch (error) {
    console.error("Error calling Genie API:", error);
    throw error;
  }
}