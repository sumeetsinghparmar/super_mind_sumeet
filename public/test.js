  var insights_list = [];
  var insight_writter_working = false;
  // DATASTAX DATA FETCHING ------------------------------

  // Function to fetch data from server
  function fetchData(sort_by, dataType) {
    const inputValue = "";
    const sortBy = sort_by || "likes";
    const dataTypeParam = dataType || "normal";
  
    $.ajax({
      url: '/api/fetchData',  // Server endpoint
      method: 'GET',
      dataType: 'json',
      data: {
        inputValue: inputValue,
        sort_by: sortBy,
        data_type: dataTypeParam
      },
      success: function (data) {
        $('#summary_btn').css('display', 'unset');
        // Populate the table with the fetched data
        const dataTableBody = $('#dataTable tbody');  // Targeting the body of the "Data" table
        const avgTableBody = $('#avg_dataTable tbody');  // Targeting the body of the "Average Data" table
        let averageData, normalData;
        dataTableBody.empty();  // Clear previous table rows
        if(dataTypeParam == "avg"){
          avgTableBody.empty();  // Clear previous table rows
          averageData = data.averageData;
          normalData = data.normalData;

          console.log("avgData :", JSON.stringify(averageData));

          // Now we will fetch insights ---------------
          if (!insight_writter_working){
            fetchInsights(JSON.stringify(averageData));
          }

          // Loop through each item in the avg data array
          averageData.forEach(function (item) {
            let row = `
              <tr data-id="${Math.floor(Math.random() * 900) + 100}">
                <td data-type="postType">${item.postType}</td>
                <td data-type="avg_likes">${item.averageLikes}</td>
                <td data-type="avg_shares">${item.averageShares}</td>
                <td data-type="avg_comments">${item.averageComments}</td>
                <td data-type="avg_reach">${item.averageReach}</td>
                <td data-type="avg_engagement">${returnEngagement(item.averageLikes, item.averageShares, item.averageComments, item.averageReach)}</td>
              </tr>
            `;
            avgTableBody.append(row);  // Add the new row to the table
          });

        }
        else {
          normalData = data;
        }
  
        // Loop through each item in the data array
        normalData.forEach(function (item) {
          let row = `
            <tr data-id="${item.postId}">
              <th scope="row">${item.postId}</th>
              <td data-type="postType">${item.postType}</td>
              <td data-type="likes">${item.likes}</td>
              <td data-type="shares">${item.shares}</td>
              <td data-type="comments">${item.comments}</td>
              <td data-type="reach">${item.reach}</td>
            </tr>
          `;
          dataTableBody.append(row);  // Add the new row to the table
        });
      },
      error: function (xhr, status, error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch data. Please try again later.');
      }
    });
  }


  function fetchInsights(data) {
    const inputValue = `${data}`;
  
    $.ajax({
      url: '/api/fetchInsights',
      method: 'GET',
      dataType: 'json',
      data: {
        inputValue: inputValue
      },
      success: function (data) {
        if(!insight_writter_working){
          insights_list = data;
          console.log(insights_list);

          greet(insights_list[greetNo]);
        }
      },
      error: function (xhr, status, error) {
        console.error('Error fetching insights:', error);
        alert('Failed to fetch insights. Please try again later.');
      }
    });
  }
  

  // Fetch data when the page is loaded
  fetchData(sort_by="likes", dataType="avg");

  //  ------------------------------------------

  // sorted drop down selection ------------

  function sortBy(sort_by="likes") {
    // console.log(sort_by + " selected");

    const dropdownMenu = document.querySelectorAll('.dropdown-menu li label');
    dropdownMenu.forEach((item) => {
      item.classList.remove('selected');
    });

    const dataTableBody = $('#dataTable tbody');
    const avgTableBody = $('#avg_dataTable tbody');
    dataTableBody.empty();
    avgTableBody.empty();
    let loading_row = `
      <tr id="loading-row">
        <td colspan="6" class="text-center">
          <div class="ld-ripple table_loading">
            <div></div>
            <div></div>
          </div>
        </td>
      </tr>
    `;
    dataTableBody.append(loading_row);
    avgTableBody.append(loading_row);

    let i_shape = 'heart';

    if(sort_by == "shares"){
      i_shape = 'share-fill';
    } else if(sort_by == "comments"){
      i_shape = 'chat-square-dots';
    } else if(sort_by == "reach"){
      i_shape = 'people-fill';
    } else {
      i_shape = 'heart';
    }
    $(`.dropdown-menu li label[for=${sort_by}]`).addClass('selected');
    const dropdown_sort_icon = $('#dropdown_sort_icon');
    dropdown_sort_icon.attr('class', `bi bi-${i_shape}`);
    fetchData(sort_by, dataType="avg");
  }

  // -----------------

    var formula_selected = "formula-1";
    var formula_weight = [1, 2, 3];

    const formula3Radio = document.getElementById("formula-3");
    const weightInputs = document.querySelectorAll(".weight_container input");
    // Function to update the weight inputs' state
    const updateWeightInputs = () => {
      const isFormula3Selected = formula3Radio.checked;
      weightInputs.forEach((input) => {
        input.disabled = !isFormula3Selected;
      });
    };

    // Add event listeners to all radio buttons
    document.querySelectorAll("input[name='value-radio']").forEach((radio) => {
      radio.addEventListener("change", updateWeightInputs);
    });

    // Initialize the state on page load
    updateWeightInputs();

    document.addEventListener("DOMContentLoaded", function () {
        document.addEventListener('hide.bs.modal', function (event) {
            if (document.activeElement) {
                document.activeElement.blur();
            }
        });
    });
    const boxContainer = document.querySelector('.box-container');
    
    
    const text = document.getElementById("text");

    var greetNo = 0;

    function greet(msg){
        if(msg === undefined){
          return;
        }
        insight_writter_working = true;
        var count = 0;
        var message = [...msg];
        const letterW = setInterval(() => {
            if(text.innerHTML == msg+'<i class="bi bi-cursor-text" id="cursor"></i>'){
                clearInterval(letterW);
                const letterD = setInterval(()=>{
                    if(text.innerHTML == '<i class="bi bi-cursor-text" id="cursor"></i>'){
                        clearInterval(letterD);
                        greetNo += 1;
                        if(greetNo == insights_list.length){
                            greetNo = 0;
                        }
                        return greet(insights_list[greetNo]);
                    }
                    text.innerHTML = message.slice(0, count).join("") + '<i class="bi bi-cursor-text" id="cursor"></i>';
                    count -= 1;
                }, 50);
                return;
            }
            text.innerHTML = message.slice(0, count).join("") + '<i class="bi bi-cursor-text" id="cursor"></i>';
            count += 1;
        }, 100);
    }

    document.addEventListener('scroll', () => {
      // Calculate the scroll percentage
      const scrollTop = window.scrollY; // Distance scrolled from the top
      const maxScroll = document.body.scrollHeight - window.innerHeight; // Maximum scrollable height
      const scrollPercentage = scrollTop / maxScroll; // Scroll percentage

      // Calculate new height for the pseudo-element
      const newHeight = scrollPercentage * 1000; // Adjust the multiplier (200) to control max height

      // Update the CSS variable for height dynamically
      document.documentElement.style.setProperty('--pseudo-height', `${newHeight}px`);
    });

    function reach_btn_toggle() {
      const reach_switch = document.getElementById('reach_switch');
      const display = (reach_switch.checked) ? 'table-cell' : 'none';
      const display_flex = (reach_switch.checked) ? 'flex' : 'none';
      document.documentElement.style.setProperty('--reach-visiblity', display);
      document.documentElement.style.setProperty('--reach-visiblity-flex', display_flex);

      formula_selected = "formula-1";
      console.log(formula_selected + " selected");
      close_formula_popup();
      removeExpandedSection();
      const onclickValue = $('#summary_btn').attr('onclick');
      sortBy();
    };
    reach_btn_toggle();

  function apply_formula() {
    const formula1 = document.getElementById('formula-1');
    const formula2 = document.getElementById('formula-2');
    const formula3 = document.getElementById('formula-3');
    const selected_formula = document.querySelector('input[name="value-radio"]:checked').value;
    const w1 = document.getElementById('w1');
    const w2 = document.getElementById('w2');
    const w3 = document.getElementById('w3');

    formula_selected = selected_formula;

    if(selected_formula == 'formula-2'){
      w1.value = 1;
      w2.value = 1;
      w3.value = 1;
    }

    w1.value = (w1.value == "") ? 1 : w1.value;
    w2.value = (w2.value == "") ? 2 : w2.value;
    w3.value = (w3.value == "") ? 3 : w3.value;

    formula_weight = [w1.value, w2.value, w3.value];
    
    removeExpandedSection();
    // console.log(selected_formula + " selected");
    sortBy();
  }

  function close_formula_popup(){
    const selected_option = document.querySelector('input[name="value-radio"]:checked');
    selected_option.checked = false;

    if(formula_selected == "formula-1"){
      document.getElementById('formula-1').checked = true;
    } else if(formula_selected == "formula-2"){
      document.getElementById('formula-2').checked = true;
    } else{
      document.getElementById('formula-3').checked = true;
    }

    updateWeightInputs();
  }

  // Function to return engagement value
  function returnEngagement(likes, shares, comments, reach, percent_visible=true) {
    const [w1, w2, w3] = formula_weight;

    if(formula_selected == "formula-1"){
      const engagement = likes + shares + comments;
      return engagement.toFixed(2);
    }
    // Engagement calculation formula
    const engagement = ((likes * w1 + shares * w2 + comments * w3) / reach) * 100;
    return (percent_visible) ? engagement.toFixed(2)+"%" : engagement.toFixed(2);
  }

  // Function to calculate and update engagement
  function calculateEngagement(likes, shares, comments, reach) {
    const [w1, w2, w3] = formula_weight;

    if(formula_selected == "formula-1"){
      // Engagement calculation formula
      const engagement = likes + shares + comments;

      // Update the engagement value in the DOM
      document.getElementById("engagementTitle").textContent = 'Total Engagement';
      document.getElementById("engagementValue").textContent = engagement;
      return engagement;
    }

    // Engagement calculation formula
    const engagement = ((likes * w1 + shares * w2 + comments * w3) / reach) * 100;

    // Update the engagement value in the DOM
    document.getElementById("engagementValue").textContent = `${engagement.toFixed(2)}%`;
    return engagement.toFixed(2)+"%";
  }

  // Adds the Expanded Section below the clicked row --------------------------------

  const table = document.getElementById("dataTable");
  const avg_table = document.getElementById("avg_dataTable");
  let expandedRow = null;

  table.addEventListener("click", (e) => {
    // Find the clicked row
    const row = e.target.closest("tr[data-id]");
    if (!row) return;

    const rowId = row.dataset.id;

    // If the same row is clicked, toggle it
    if (expandedRow === rowId) {
      removeExpandedSection();
      expandedRow = null;
      return;
    }

    // Remove the previous expanded section
    removeExpandedSection();

    // Add a new expanded section below the clicked row
    addExpandedSection(row, rowId, table_type="normal");
    expandedRow = rowId;
  });

  avg_table.addEventListener("click", (e) => {
    // Find the clicked row
    const row = e.target.closest("tr[data-id]");
    if (!row) return;

    const rowId = row.dataset.id;

    // If the same row is clicked, toggle it
    if (expandedRow === rowId) {
      removeExpandedSection();
      expandedRow = null;
      return;
    }

    // Remove the previous expanded section
    removeExpandedSection();

    // Add a new expanded section below the clicked row
    addExpandedSection(row, rowId, table_type="avg");
    expandedRow = rowId;
  });

  function removeExpandedSection() {
    const existingSection = document.querySelector(".expanded-section");
    if (existingSection) {
      existingSection.remove();
    }
  }

  function addExpandedSection(row, rowId, table_type) {
    const section = document.createElement("tr");

    if(table_type == "normal"){
      const row_data = document.querySelector(`#dataTable tr[data-id="${rowId}"]`);
      console.log(row_data);

      // Fetch the data (likes, shares, comments, reach)
      const postId = row_data.querySelector('th').textContent;
      const likes = parseInt(row_data.querySelector('td[data-type="likes"]').textContent);
      const shares = parseInt(row_data.querySelector('td[data-type="shares"]').textContent);
      const comments = parseInt(row_data.querySelector('td[data-type="comments"]').textContent);
      const reach = parseInt(row_data.querySelector('td[data-type="reach"]').textContent);

      section.className = "expanded-section";
      section.innerHTML = `
        <td colspan="6">
          <h4>Engagement Data for Post ID: ${postId}</h4>
          <div class="chart-container">
            <canvas id="engagementChart" width="100" height="100"></canvas>
            <div id="engagementPercent" class="engagement-percent">
              <h5 id="engagementTitle">Engagement (%)</h5>
              <p id="engagementValue">Calculating...</p>
            </div>
          </div>
        </td>
      `;
      row.insertAdjacentElement("afterend", section);
      // Render the chart
      renderChart(likes, shares, comments, reach);
      calculateEngagement(likes, shares, comments, reach);
    }
    else {
      const row_data = document.querySelector(`#avg_dataTable tr[data-id="${rowId}"]`);
      console.log(row_data);

      // Fetch the data (likes, shares, comments, reach)
      const postType = row_data.querySelector('td[data-type="postType"]').textContent;
      const likes = parseFloat(row_data.querySelector('td[data-type="avg_likes"]').textContent);
      const shares = parseFloat(row_data.querySelector('td[data-type="avg_shares"]').textContent);
      const comments = parseFloat(row_data.querySelector('td[data-type="avg_comments"]').textContent);
      const reach = parseFloat(row_data.querySelector('td[data-type="avg_reach"]').textContent);

      section.className = "expanded-section";
      section.innerHTML = `
        <td colspan="6">
          <h4>Engagement Data for Post Type: ${postType}</h4>
          <div class="chart-container">
            <canvas id="engagementChart" width="100" height="100"></canvas>
            <div id="engagementPercent" class="engagement-percent">
              <h5 id="engagementTitle">Engagement (%)</h5>
              <p id="engagementValue">Calculating...</p>
            </div>
          </div>
        </td>
      `;
      row.insertAdjacentElement("afterend", section);
      // Render the chart
      renderChart(likes, shares, comments, reach);
      calculateEngagement(likes, shares, comments, reach);
    }
  }

  // Function to render the pie chart
  function renderChart(likes, shares, comments, reach) {
    const ctx = document.getElementById('engagementChart').getContext('2d');
    const reach_switch = document.getElementById('reach_switch');
    const data = (reach_switch.checked) ? {
      labels: ['Likes', 'Shares', 'Comments', 'Reach'],
      datasets: [{
        data: [likes, shares, comments, reach],
        backgroundColor: ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99'],
        borderColor: ['#ff6666', '#3399ff', '#66ff66', '#ff9966'],
        borderWidth: 1
      }]
    } : {
      labels: ['Likes', 'Shares', 'Comments'],
      datasets: [{
        data: [likes, shares, comments],
        backgroundColor: ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99'],
        borderColor: ['#ff6666', '#3399ff', '#66ff66', '#ff9966'],
        borderWidth: 1
      }]
    };
      
    // Pie chart configuration
    new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 3, // Make the aspect ratio more square or adjust to fit small size
        plugins: {
          tooltip: {
            callbacks: {
              label: function(tooltipItem) {
                return tooltipItem.label + ": " + tooltipItem.raw;
              }
            }
          }
        }
      }
    });
  }



  function renderSmallChart(canvasId, title, data, sharedLabels, isLarge = false) {
    const ctx = document.getElementById(canvasId).getContext('2d');
  
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: sharedLabels,
        datasets: [{
          data: data,
          backgroundColor: ['#ff9999', '#66b3ff', '#99ff99'],
          borderColor: ['#ff6666', '#3399ff', '#66ff66'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: !isLarge,
        plugins: {
          title: {
            display: true,
            text: title,
            font: {
              size: isLarge ? 18 : 14, // Larger font for the larger chart
              weight: 'bold'
            }
          },
          legend: {
            display: false // Disable individual legends
          }
        }
      }
    });
  }

  // Function to retrieve data from the table and calculate engagement
  function getAvgDataFromTable() {
    const avgLikes = [];
    const avgShares = [];
    const avgComments = [];
    const avgReach = [];
    const avgEngagement = [];

    $('#avg_dataTable tbody tr').each(function() {
      const likes = parseFloat($(this).find('td:nth-child(2)').text()); // Second column is avg_likes
      const shares = parseFloat($(this).find('td:nth-child(3)').text()); // Third column is avg_shares
      const comments = parseFloat($(this).find('td:nth-child(4)').text()); // Fourth column is avg_comments
      const reach = parseFloat($(this).find('td:nth-child(5)').text()); // Fifth column is avg_reach

      avgLikes.push(likes);
      avgShares.push(shares);
      avgComments.push(comments);
      avgReach.push(reach);

      // Calculate engagement for this row
      const engagement = returnEngagement(likes, shares, comments, reach, percent_visible=false);
      avgEngagement.push(engagement);
    });

    return { avgLikes, avgShares, avgComments, avgReach, avgEngagement };
  }

  // Function to show/hide the summary data
  function show_summary(){
    const { avgLikes, avgShares, avgComments, avgReach, avgEngagement} = getAvgDataFromTable();
    console.log(avgEngagement);
    const sharedLabels = ["Static Images", "Carousel", "Reels"]; // Shared legend labels

    const avg_dataTable = document.getElementById('avg_dataTable');
    const row = `
      <td colspan="6">
        <h4>Average Summary Data</h4>
        <div class="charts-container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
          <!-- First row with 4 charts -->
          <div class="chart-wrapper small">
            <canvas id="likesChart" width="80" height="80"></canvas>
          </div>
          <div class="chart-wrapper small">
            <canvas id="sharesChart" width="80" height="80"></canvas>
          </div>
          <div class="chart-wrapper small">
            <canvas id="commentsChart" width="80" height="80"></canvas>
          </div>
          <div class="chart-wrapper small">
            <canvas id="reachChart" width="80" height="80"></canvas>
          </div>
        </div>
        <!-- Second row with 1 large chart -->
        <div class="chart-wrapper large" style="margin-top: 20px;">
          <canvas id="overallChart" width="120" height="120"></canvas>
        </div>
        <div class="shared-legend" style="text-align: center; margin-top: 10px;">
          <span style="color: #ff9999;">⬤ Static Images</span>
          <span style="color: #66b3ff; margin-left: 10px;">⬤ Carousel</span>
          <span style="color: #99ff99; margin-left: 10px;">⬤ Reels</span>
        </div>
      </td>
    `;
    $('#avg_dataTable tbody').append(row);
    $('#summary_btn').attr('onclick', 'hide_summary()');
    $('#summary_btn').html("Hide Summary");

    // Render small charts
    renderSmallChart("likesChart", "Average Likes", avgLikes, sharedLabels);
    renderSmallChart("sharesChart", "Average Shares", avgShares, sharedLabels);
    renderSmallChart("commentsChart", "Average Comments", avgComments, sharedLabels);
    renderSmallChart("reachChart", "Average Reach", avgReach, sharedLabels);

    // Render large chart
    renderSmallChart("overallChart", "Average Engagement", avgEngagement, sharedLabels, true);
  }
  function hide_summary(){
    $('#avg_dataTable tbody td').last().remove();
    $('#summary_btn').attr('onclick', 'show_summary()');
    $('#summary_btn').html("Show Summary");
  }

  // ------------------------------------


    


    // Function to generate boxes based on screen size
    function generateBoxes() {
      // Clear existing boxes (in case the window is resized)
      boxContainer.innerHTML = '';

      // Get screen width and height
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Calculate the number of boxes based on screen size
      const boxSize = 40; // Size of each box
      const cols = Math.floor(screenWidth / boxSize); // Number of columns
      const rows = Math.floor(screenHeight / boxSize); // Number of rows

      // Set the grid layout based on calculated number of columns and rows
      boxContainer.style.gridTemplateColumns = `repeat(${cols}, ${boxSize}px)`;
      boxContainer.style.gridTemplateRows = `repeat(${rows}, ${boxSize}px)`;

      // Generate the boxes
      for (let i = 0; i < cols * rows; i++) {
        const box = document.createElement('div');
        box.classList.add('box');
        boxContainer.appendChild(box);
      }
    }

    // Call the function to generate boxes when the page loads
    generateBoxes();

    // Re-generate boxes on window resize to adjust the grid
    window.addEventListener('resize', generateBoxes);

    // Function to calculate distance between two points
    function getDistance(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    document.addEventListener('mousemove', (e) => {
      const rect = boxContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left; // Mouse X relative to container
      const mouseY = e.clientY - rect.top; // Mouse Y relative to container

      // Add bulging effect to boxes depending on their distance to the mouse
      const boxes = document.querySelectorAll('.box');
      boxes.forEach(box => {
        const boxRect = box.getBoundingClientRect();
        const boxX = boxRect.left + boxRect.width / 2; // Box center X
        const boxY = boxRect.top + boxRect.height / 2; // Box center Y

        const distance = getDistance(mouseX, mouseY, boxX, boxY);

        // Set translateZ intensity based on distance (closer = larger depth towards the user)
        const depthIntensity = Math.max(0, (1 - distance / 300)) * 150; // Max translateZ is 150px

        // Apply the 3D bulging effect to the box based on the calculated depth
        box.style.transform = `translateZ(${depthIntensity}px)`;
      });
    });

    // Handle mouseleave to reset box transformations and hide the glow
    document.addEventListener('mouseleave', () => {
      const boxes = document.querySelectorAll('.box');
      boxes.forEach(box => {
        box.style.transform = 'translateZ(0)'; // Reset depth
      });
    });

    const uploadButton = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('dataFile');
    const form = document.getElementById('uploadForm');

    // Trigger the file input click when the button is clicked
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Show spinner and change button state while uploading
      uploadButton.classList.add('uploading');
      uploadButton.innerHTML = '<div class="spinner"></div> Uploading';

      // Create a FormData object and append the file
      const formData = new FormData();
      formData.append('dataFile', file);

      try {
        // Upload the file
        const response = await fetch('/api/uploadData', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          alert(result.message);
          window.location.reload();
        } else {
          alert(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error("Upload Error:", error);
        alert("Failed to upload data. Please try again.");
      } finally {
        // Reset button and hide spinner after upload completes
        uploadButton.classList.remove('uploading');
        uploadButton.innerHTML = 'Upload';
      }
    });