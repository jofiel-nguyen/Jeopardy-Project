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
$("#active-clue").on("click", handleClickOfActiveClue);

/**
 * Manages the behavior of the play button (start or restart) when clicked.
 * Sets up the game.
 *
 * Hints:
 * - Sets up the game when the play button is clickable.
 */
function handleClickOfPlay ()
{
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
{
    // Prevent multiple clicks
    isPlayButtonClickable = false;
    $("#play").text("Loading...");
    $("#play").prop("disabled", true);

    // Show spinner and hide game board
    $("#spinner").removeClass("hidden");
    $("#game-board").addClass("hidden");
    $("#active-clue").html("Loading game data...");

    // Reset the DOM (table, button text, the end text)
    $("#categories").empty();
    $("#clues").empty();
    activeClue = null;
    activeClueMode = 0;

    try {
        const categoryIds = await getCategoryIds();
        categories = []; // Clear previous categories

        for (let i = 0; i < categoryIds.length; i++) {
            const categoryData = await getCategoryData(categoryIds[i]);
            // Ensure we only add categories that actually have enough filtered clues
            if (categoryData.clues.length === NUMBER_OF_CLUES_PER_CATEGORY) {
                categories.push(categoryData);
            }
            // Optional: If you want to keep trying to fetch more categories until you have enough,
            // you'd need a more complex loop here, possibly fetching more initial IDs than needed.
            if (categories.length === NUMBER_OF_CATEGORIES) {
                break; // Stop fetching if we have enough
            }
        }

        if (categories.length < NUMBER_OF_CATEGORIES) {
            console.warn(`Could not load ${NUMBER_OF_CATEGORIES} categories with ${NUMBER_OF_CLUES_PER_CATEGORY} valid clues each. Loaded ${categories.length}.`);
            // You might want to display a different message or handle this more gracefully.
            if (categories.length === 0) {
                $("#active-clue").html("Failed to load any game data. Please try again.");
                return;
            }
        }
        
        // Fill the table only if categories were successfully loaded
        if (categories.length > 0) {
            fillTable(categories);
            $("#active-clue").html("Click a clue to reveal the question!");
        } else {
            $("#active-clue").html("No game data available. Please try again.");
        }

    } catch (error) {
        console.error("Error setting up the game:", error);
        $("#active-clue").html("Error loading game. Please check your connection and try again.");
    } finally {
        // Always hide the spinner and enable the play button
        $("#spinner").addClass("hidden");
        $("#game-board").removeClass("hidden"); // Show game board even if empty/error
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
    // Fetch a large number of categories to pick from
    const response = await axios.get(`${API_URL}categories?count=100`);
    const allCategories = response.data;

    // Filter categories that have enough clues
    const suitableCategories = allCategories.filter(cat => cat.clues_count >= NUMBER_OF_CLUES_PER_CATEGORY);

    // Shuffle the suitable categories
    for (let i = suitableCategories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [suitableCategories[i], suitableCategories[j]] = [suitableCategories[j], suitableCategories[i]];
    }

    // Take only the required number of categories and map to their IDs
    const ids = suitableCategories.slice(0, NUMBER_OF_CATEGORIES).map(cat => cat.id);
    return ids;
}

/**
 * Gets category with as many clues as given in the `NUMBER_OF_CLUES` constant.
 * Returns the below data structure:
 *  {
 *    "id": <category ID>
 *    "title": <category name>
 *    "clues": [
 *      {
 *        "id": <clue ID>,
 *        "value": <value of the question>,
 *        "question": <question>,
 *        "answer": <answer to the question>
 *      },
 *      ... more clues
 *    ]
 *  }
 *
 * Hints:
 * - You need to call this function for each category ID returned from the `getCategoryIds` function.
 * - Use /category endpoint of the API.
 * - In the API, not all clues have a value. You can assign your own value or skip that clue.
 */
async function getCategoryData (categoryId)
{
    const response = await axios.get(`${API_URL}category?id=${categoryId}`);
    const apiCategory = response.data;

    const categoryWithClues = {
        id: apiCategory.id,
        title: apiCategory.title,
        clues: []
    };

    // Filter clues to ensure they have question, answer, and a valid value
    let filteredClues = apiCategory.clues.filter(clue =>
        clue.question && clue.answer && (clue.value !== null && clue.value !== undefined && clue.value > 0)
    );

    // Shuffle the filtered clues to get a random set
    for (let i = filteredClues.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredClues[i], filteredClues[j]] = [filteredClues[j], filteredClues[i]];
    }

    // Take NUMBER_OF_CLUES_PER_CATEGORY amount of clues
    categoryWithClues.clues = filteredClues.slice(0, NUMBER_OF_CLUES_PER_CATEGORY).map((clue) => ({
        id: clue.id,
        value: clue.value, // Use the fetched value directly if it passed filter, otherwise it's skipped.
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
 *   For each category, you should create a cell element (th) and append that to it.
 * - Table body (tbody) has a row (#clues).
 *   For each category, you should create a cell element (td) and append that to it.
 *   Besides, for each clue in a category, you should create a row element (tr) and append it to the corresponding previously created and appended cell element (td).
 * - To this row elements (tr) should add an event listener (handled by the `handleClickOfClue` function) and set their IDs with category and clue IDs. This will enable you to detect which clue is clicked.
 */
function fillTable (categories)
{
    const $categoriesRow = $("#categories");
    const $cluesBody = $("#clues");

    $categoriesRow.empty();
    $cluesBody.empty();

    // Fill table headers (categories)
    for (let category of categories) {
        $categoriesRow.append(`<th class="rounded-t-xl">${category.title.toUpperCase()}</th>`);
    }

    // Fill table body (clues)
    for (let i = 0; i < NUMBER_OF_CLUES_PER_CATEGORY; i++) {
        const $row = $("<tr>");
        for (let j = 0; j < categories.length; j++) {
            const category = categories[j];
            const clue = category.clues[i]; // Get the clue for this row and category

            if (clue) {
                $row.append(`
                    <td class="clue rounded-xl" data-category-id="${category.id}" data-clue-id="${clue.id}">
                        $${clue.value}
                    </td>
                `);
            } else {
                // If a clue is missing (e.g., due to filtering), add an empty/disabled cell
                $row.append(`<td class="viewed rounded-xl"></td>`);
            }
        }
        $cluesBody.append($row);
    }
    
    // Attach click handlers AFTER the elements are added to the DOM
    // This is crucial for dynamic content
    $(".clue").on("click", handleClickOfClue);
}


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
{
    if (activeClueMode === 0) { // Only allow a clue to be clicked if no active clue is displayed
        const $clickedClueCell = $(event.target);
        const categoryId = $clickedClueCell.data("category-id");
        const clueId = $clickedClueCell.data("clue-id");

        let foundClue = null;
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].id === categoryId) {
                for (let j = 0; j < categories[i].clues.length; j++) {
                    if (categories[i].clues[j].id === clueId) {
                        foundClue = categories[i].clues[j];
                        // Remove the clue from the array so it can't be selected again
                        categories[i].clues.splice(j, 1);
                        break;
                    }
                }
                if (foundClue) {
                    // If the category now has no clues left, remove the category itself
                    if (categories[i].clues.length === 0) {
                        categories.splice(i, 1);
                    }
                    break;
                }
            }
        }

        if (foundClue) {
            activeClue = foundClue;
            
            // Mark clue as viewed, remove click handler, and clear text
            $clickedClueCell.addClass("viewed");
            $clickedClueCell.off("click"); // Prevent further clicks on this specific cell
            $clickedClueCell.html(""); // Clear the value from the board

            // Display the question at #active-clue
            $("#active-clue").html(activeClue.question);
            activeClueMode = 1; // Transition to "showing question" mode
        }
    }
}

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
    if (activeClueMode === 1) { // Currently showing a question
        activeClueMode = 2; // Transition to "showing answer" mode
        $("#active-clue").html(activeClue.answer); // Display the answer
    }
    else if (activeClueMode === 2) { // Currently showing an answer
        activeClueMode = 0; // Transition back to "empty" mode
        $("#active-clue").html(""); // Clear the active clue display

        // Check if all categories and clues have been exhausted to end the game
        if (categories.length === 0) {
            isPlayButtonClickable = true; // Make the play button clickable for restart
            $("#play").text("Restart the Game!"); // Change button text
            $("#active-clue").html("The End! Click 'Restart the Game!' to play again."); // Display game over message
        }
    }
}
