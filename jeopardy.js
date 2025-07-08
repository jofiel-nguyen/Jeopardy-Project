// You only need to touch comments with the todo of this file to complete the assignment!

/*
=== How to build on top of the starter code? ===

Problems have multiple solutions.
We have created a structure to help you on solving this problem.
On top of the structure, we created a flow shaped via the below functions.
We left descriptions, hints, and to-do sections in between.
If you want to use this code, fill in the to-do sections.
However, if you're going to solve this problem yourself in different ways, you can ignore this starter code.
 */

/*
=== Terminology for the API ===

Clue: The name given to the structure that contains the question and the answer together.
Category: The name given to the structure containing clues on the same topic.
 */

/*
=== Data Structure of Request the API Endpoints ===

/categories:
[
  {
    "id": <category ID>,
    "title": <category name>,
    "clues_count": <number of clues in the category where each clue has a question, an answer, and a value>
  },
  ... more categories
]

/category:
{
  "id": <category ID>,
  "title": <category name>,
  "clues_count": <number of clues in the category>,
  "clues": [
    {
      "id": <clue ID>,
      "answer": <answer to the question>,
      "question": <question>,
      "value": <value of the question (be careful not all questions have values) (Hint: you can assign your own value such as 200 or skip)>,
      ... more properties
    },
    ... more clues
  ]
}
 */

const API_URL = "https://rithm-jeopardy.herokuapp.com/api/"; // The URL of the API.
const NUMBER_OF_CATEGORIES = 6; // The number of categories you will be fetching. You can change this number.
const NUMBER_OF_CLUES_PER_CATEGORY = 5; // The number of clues you will be displaying per category. You can change this number.

let categories = []; // The categories with clues fetched from the API.
/*
[
  {
    "id": <category ID>,
    "title": <category name>,
    "clues": [
      {
        "id": <clue ID>,
        "value": <value (e.g. $200)>,
        "question": <question>,
        "answer": <answer>
      },
      ... more categories
    ]
  },
  ... more categories
]
 */

let activeClue = null; // Currently selected clue data.
let activeClueMode = 0; // Controls the flow of #active-clue element while selecting a clue, displaying the question of selected clue, and displaying the answer to the question.
/*
0: Empty. Waiting to be filled. If a clue is clicked, it shows the question (transits to 1).
1: Showing a question. If the question is clicked, it shows the answer (transits to 2).
2: Showing an answer. If the answer is clicked, it empties (transits back to 0).
 */

let isPlayButtonClickable = true; // Only clickable when the game haven't started yet or ended. Prevents the button to be clicked during the game.

$("#play").on("click", handleClickOfPlay);
$("#active-clue").on("click", handleClickOfActiveClue);//adding more
/**
 * Manages the behavior of the play button (start or restart) when clicked.
 * Sets up the game.
 *
 * Hints:
 * - Sets up the game when the play button is clickable.
 */
function handleClickOfPlay ()
{
  // todo set the game up if the play button is clickable
   if (isPlayButtonClickable) {
                setupTheGame();
            }
}

/**
 * Sets up the game.
 *
 * 1. Cleans the game since the user can be restarting the game.
 * 2. Get category IDs
 * 3. For each category ID, get the category with clues.
 * 4. Fill the HTML table with the game data.
 *
 * Hints:
 * - The game play is managed via events.
 */
async function setupTheGame ()
{ isPlayButtonClickable = false;
  $("#play").text("Loading...");
  $("#play").prop("disabled", true);
  // todo show the spinner while setting up the game
  $("#spinner").removeClass("hidden");
  $("#game-board").addClass("hidden");
  $("#active-clue").html("Loading game data...");
  // todo reset the DOM (table, button text, the end text)
  $("#categories").empty();
  $("#clues").empty();
  activeClue = null;
  activeClueMode = 0;
  // todo fetch the game data (categories with clues)
  try{
    const categoryIds = await getCategoryIds();
                categories = []; // Clear previous categories
                for (let i = 0; i < categoryIds.length; i++) {
                    const categoryData = await getCategoryData(categoryIds[i]);
                 
                    if (categoryData.clues.length === NUMBER_OF_CLUES_PER_CATEGORY) {
                        categories.push(categoryData);
                    }
                }

                // If we didn't get enough categories, try again (simple retry logic)
                if (categories.length < NUMBER_OF_CATEGORIES) {
                    console.warn("Not enough categories with sufficient clues found. Retrying...");
                    // A more robust solution might involve fetching more categories or a loop.
                    // For this exercise, we'll just proceed with what we have or indicate failure.
                    // For now, let's just ensure we have at least one category to display something.
                    if (categories.length === 0) {
                        $("#active-clue").html("Failed to load game data. Please try again.");
                        return;
                    }
                }
    
  // todo fill the table
  fillTable(categories);
}catch (error) {
                console.error("Error setting up the game:", error);
                $("#active-clue").html("Error loading game. Please check your connection and try again.");
            } finally {
                // Hide the spinner and show the game board
                $("#spinner").addClass("hidden");
                $("#game-board").removeClass("hidden");
                $("#active-clue").html("Click a clue to reveal the question!");
                $("#play").text("Restart Game!");
                $("#play").prop("disabled", false); // Enable button
                isPlayButtonClickable = true;
            }
        }

/**
 * Gets as many category IDs as in the `NUMBER_OF_CATEGORIES` constant.
 * Returns an array of numbers where each number is a category ID.
 *
 * Hints:
 * - Use /categories endpoint of the API.
 * - Request as many categories as possible, such as 100. Randomly pick as many categories as given in the `NUMBER_OF_CATEGORIES` constant, if the number of clues in the category is enough (<= `NUMBER_OF_CLUES` constant).
 */
async function getCategoryIds ()
{
  const ids = suitableCategories.slice(0, NUMBER_OF_CATEGORIES).map(cat => cat.id); // todo set after fetching
  const suitableCategories = allCategories.filter(cat => cat.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY);
  for (let i = suitableCategories.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [suitableCategories[i], suitableCategories[j]] = [suitableCategories[j], suitableCategories[i]];
            }

  // todo fetch NUMBER_OF_CATEGORIES amount of categories
  const response = await axios.get(`${API_URL}categories?count=100`);
  const allCategories = response.data;
  return ids;
}

/**
 * Gets category with as many clues as given in the `NUMBER_OF_CLUES` constant.
 * Returns the below data structure:
 *  {
 *    "id": <category ID>
 *    "title": <category name>
 *    "clues": [
 *      {
 *        "id": <clue ID>,
 *        "value": <value of the question>,
 *        "question": <question>,
 *        "answer": <answer to the question>
 *      },
 *      ... more clues
 *    ]
 *  }
 *
 * Hints:
 * - You need to call this function for each category ID returned from the `getCategoryIds` function.
 * - Use /category endpoint of the API.
 * - In the API, not all clues have a value. You can assign your own value or skip that clue.
 */
async function getCategoryData (categoryId)
{ const response = await axios.get(`${API_URL}category?id=${categoryId}`);
  const apiCategory = response.data;
  const categoryWithClues = {
    id: apiCategory.id,
    title: apiCategory.title, // todo set after fetching
    clues: [] // todo set after fetching
  };

  // todo fetch the category with NUMBER_OF_CLUES_PER_CATEGORY amount of clues
const filteredClues = apiCategory.clues.filter(clue =>
                clue.question && clue.answer && clue.value !== null && clue.value !== undefined
            );
 for (let i = filteredClues.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filteredClues[i], filteredClues[j]] = [filteredClues[j], filteredClues[i]];
            }

            // Take NUMBER_OF_CLUES_PER_CATEGORY amount of clues
            categoryWithClues.clues = filteredClues.slice(0, NUMBER_OF_CLUES_PER_CATEGORY).map((clue, index) => ({
                id: clue.id,
                value: clue.value || (index + 1) * 100, // Assign a default value if missing
                question: clue.question,
                answer: clue.answer
            }));



  return categoryWithClues;
}

/**
 * Fills the HTML table using category data.
 *
 * Hints:
 * - You need to call this function using an array of categories where each element comes from the `getCategoryData` function.
 * - Table head (thead) has a row (#categories).
 *   For each category, you should create a cell element (th) and append that to it.
 * - Table body (tbody) has a row (#clues).
 *   For each category, you should create a cell element (td) and append that to it.
 *   Besides, for each clue in a category, you should create a row element (tr) and append it to the corresponding previously created and appended cell element (td).
 * - To this row elements (tr) should add an event listener (handled by the `handleClickOfClue` function) and set their IDs with category and clue IDs. This will enable you to detect which clue is clicked.
 */
function fillTable (categories)
{
  // todo
              const $categoriesRow = $("#categories");
            const $cluesBody = $("#clues");

            $categoriesRow.empty();
            $cluesBody.empty();

            
            for (let category of categoriesToDisplay) {
                $categoriesRow.append(`<th class="rounded-t-xl">${category.title.toUpperCase()}</th>`);
            }

            for (let i = 0; i < NUMBER_OF_CLUES_PER_CATEGORY; i++) {
                const $row = $("<tr>");
                for (let j = 0; j < categoriesToDisplay.length; j++) {
                    const category = categoriesToDisplay[j];
                    // Check if the clue exists for this row/category
                    const clue = category.clues[i];
                    if (clue) {
                        // Use a data attribute to store category and clue IDs
                        $row.append(`
                            <td class="clue rounded-xl" data-category-id="${category.id}" data-clue-id="${clue.id}">
                                $${clue.value}
                            </td>
                        `);
                    } else {
                        // If a clue is missing for some reason, add an empty cell
                        $row.append(`<td class="viewed rounded-xl"></td>`);
                    }
                }
                $cluesBody.append($row);
            }

}

$(".clue").on("click", handleClickOfClue);

/**
 * Manages the behavior when a clue is clicked.
 * Displays the question if there is no active question.
 *
 * Hints:
 * - Control the behavior using the `activeClueMode` variable.
 * - Identify the category and clue IDs using the clicked element's ID.
 * - Remove the clicked clue from categories since each clue should be clickable only once. Don't forget to remove the category if all the clues are removed.
 * - Don't forget to update the `activeClueMode` variable.
 *
 */
function handleClickOfClue (event)
{ if (activeClueMode === 0) {
                const $clickedClueCell = $(event.target);
                const categoryId = $clickedClueCell.data("category-id");
                const clueId = $clickedClueCell.data("clue-id");
  // todo find and remove the clue from the categories
let foundClue = null;
                for (let i = 0; i < categories.length; i++) {
                    if (categories[i].id === categoryId) {
                        for (let j = 0; j < categories[i].clues.length; j++) {
                            if (categories[i].clues[j].id === clueId) {
                                foundClue = categories[i].clues[j];
                                // Remove the clue from the array
                                categories[i].clues.splice(j, 1);
                                break;
                            }
                        }
                        if (foundClue) {
                            // If the category now has no clues, remove the category itself
                            if (categories[i].clues.length === 0) {
                                categories.splice(i, 1);
                            }
                            break;
                        }
                    }
  // todo mark clue as viewed (you can use the class in style.css), display the question at #active-clue
                   if (foundClue) {
                    activeClue = foundClue;
                    
                    $clickedClueCell.addClass("viewed");
                    $clickedClueCell.off("click");
                    $clickedClueCell.html(" "); 

                    // Display the question at #active-clue
                    $("#active-clue").html(activeClue.question);
                    activeClueMode = 1; 
                }
            }
}

$("#active-clue").on("click", handleClickOfActiveClue);

/**
 * Manages the behavior when a displayed question or answer is clicked.
 * Displays the answer if currently displaying a question.
 * Clears if currently displaying an answer.
 *
 * Hints:
 * - Control the behavior using the `activeClueMode` variable.
 * - After clearing, check the categories array to see if it is empty to decide to end the game.
 * - Don't forget to update the `activeClueMode` variable.
 */
function handleClickOfActiveClue (event)
{
  // todo display answer if displaying a question
if (activeClueMode === 1) {
                activeClueMode = 2;
                $("#active-clue").html(activeClue.answer);
            }
  // todo clear if displaying an answer
  else if (activeClueMode === 2) {
                activeClueMode = 0;
                $("#active-clue").html("Click a clue to reveal the question!");
                activeClue = null;
  // todo after clear end the game when no clues are left
const allCluesViewed = $(".clue:not(.viewed)").length === 0;

                if (allCluesViewed || categories.length === 0) {
                    isPlayButtonClickable = true;
                    $("#play").text("Play Again!");
                    $("#play").prop("disabled", false);
                    $("#active-clue").html("Game Over! Click 'Play Again!' to restart.");
                }
            }
  if (activeClueMode === 1)
  {
    activeClueMode = 2;
    $("#active-clue").html(activeClue.answer);
  }
  else if (activeClueMode === 2)
  {
    activeClueMode = 0;
    $("#active-clue").html(null);

    if (categories.length === 0)
    {
      isPlayButtonClickable = true;
      $("#play").text("Restart the Game!");
      $("#active-clue").html("The End!");
    }
  }
}
