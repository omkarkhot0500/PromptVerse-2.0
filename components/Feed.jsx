"use client";

import { useState, useEffect } from "react";
import PromptCard from "./PromptCard";
import run from "../app/Config/Gimini"; // Import the Gemini AI function

const PromptCardList = ({ data, handleTagClick }) => {
  return (
    <div className="mt-16 prompt_layout">
      {data.map((post) => (
        <PromptCard
          key={post._id}
          post={post}
          handleTagClick={handleTagClick}
        />
      ))}
    </div>
  );
};

const Feed = () => {
  const [allPosts, setAllPosts] = useState([]);

  // Search states
  const [searchText, setSearchText] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searchedResults, setSearchedResults] = useState([]);

  // Gemini AI States
  const [input, setInput] = useState(""); // Input for Gemini AI
  const [recentPrompt, setRecentPrompt] = useState(""); // The recent prompt from Gemini AI
  const [resultData, setResultData] = useState(""); // Result data from Gemini AI
  const [loading, setLoading] = useState(false); // Loading state for Gemini AI

  // Fetch prompts from the database
  const fetchPosts = async () => {
    const response = await fetch("/api/prompt");
    const data = await response.json();
    setAllPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Filter prompts based on the search text
  const filterPrompts = (searchText) => {
    const regex = new RegExp(searchText, "i"); // 'i' flag for case-insensitive search
    return allPosts.filter(
      (item) =>
        regex.test(item.creator.username) ||
        regex.test(item.tag) ||
        regex.test(item.prompt)
    );
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    clearTimeout(searchTimeout);
    setSearchText(e.target.value);

    // debounce method
    setSearchTimeout(
      setTimeout(() => {
        const searchResult = filterPrompts(e.target.value);
        setSearchedResults(searchResult);
      }, 500)
    );
  };

  // Handle Gemini AI prompt submission
  const handleGeminiSubmit = async () => {
    setLoading(true);
    setResultData(""); // Reset result data before loading

    // Send the input prompt to Gemini AI
    const response = await run(input);
    setRecentPrompt(input); // Store the recent prompt
    setInput(""); // Clear input after submitting

    // Format the response for display
    let responseArray = response.split("**");
    let formattedResponse = "";
    for (let i = 0; i < responseArray.length; i++) {
      formattedResponse +=
        i % 2 === 1 ? `<b>${responseArray[i]}</b>` : responseArray[i];
    }
    setResultData(formattedResponse.replace(/\*/g, "</br>"));
    setLoading(false);
  };

  // Handle tag click
  const handleTagClick = (tagName) => {
    setSearchText(tagName);
    const searchResult = filterPrompts(tagName);
    setSearchedResults(searchResult);
  };

  return (
    <section className="feed">
      {/* Gemini AI Search Bar */}
      <div className="gemini-search-box flex items-center space-x-2">
        <input
          type="text"
          placeholder="Ask Gemini AI a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input) {
              handleGeminiSubmit();
            }
          }}
          className="search_input peer"
        />
        <button
          onClick={handleGeminiSubmit}
          disabled={!input}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          Ask
        </button>
      </div>

      {/* Display Gemini AI Results */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        resultData && (
          <div
          className="gemini-result mb-2 flex flex-col p-4 border border-gray-300 rounded-lg shadow-md bg-white max-h-60 overflow-y-auto space-y-2"
          dangerouslySetInnerHTML={{ __html: resultData }}
        ></div>
        )
      )}

      {/* Original Search Bar for Searching Prompts */}
      <form className="relative w-full flex-center">
        <input
          type="text"
          placeholder="Search for a tag or a username"
          value={searchText}
          onChange={handleSearchChange}
          required
          className="search_input peer"
        />
      </form>

      {/* Display Prompts */}
      {searchText ? (
        <PromptCardList
          data={searchedResults}
          handleTagClick={handleTagClick}
        />
      ) : (
        <PromptCardList data={allPosts} handleTagClick={handleTagClick} />
      )}
    </section>
  );
};

export default Feed;
