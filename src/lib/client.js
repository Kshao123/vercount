var visitorCounterCaller, visitorCounterDisplay;
(function () {
  var documentReady,
    readyCallbacks = [],
    isDocumentReady = false;

  documentReady = function (callback) {
    if (
      isDocumentReady ||
      document.readyState === "interactive" ||
      document.readyState === "complete"
    ) {
      callback.call(document);
    } else {
      readyCallbacks.push(callback);
      document.addEventListener("DOMContentLoaded", onDocumentReady);
    }
  };

  function onDocumentReady() {
    isDocumentReady = true;
    document.removeEventListener("DOMContentLoaded", onDocumentReady);
    readyCallbacks.forEach((callback) => callback.call(document));
    readyCallbacks = [];
  }

  const getBaseUrl = () => {
    return "https://busuanzi.ksh7.com";
  };

  visitorCounterCaller = {
    fetch: async function (callback) {
      const baseUrl = getBaseUrl();
      const apiUrl = `${baseUrl}/log`;
      try {
        visitorCounterDisplay.hideAll();
        
        const response = await fetch(`${apiUrl}?url=${encodeURIComponent(window.location.href)}`, {
          // method: "POST",
          // headers: {
          //   "Content-Type": "application/json",
          // },
          // body: JSON.stringify({ url: window.location.href }),
        });
        const data = await response.json();
        documentReady(() => {
          callback(data);
          localStorage.setItem("visitorCountData", JSON.stringify(data));
          visitorCounterDisplay.showAll();
        });
      } catch (error) {
        console.error("Error fetching visitor count:", error);
        visitorCounterDisplay.hideAll();
      }
    },
  };

  visitorCounterDisplay = {
    counterIds: ["site_pv", "page_pv", "site_uv"],
    updateText: function (data) {
      this.counterIds.forEach((id) => {
        // Update busuanzi elements
        const busuanziElement = document.getElementById("busuanzi_value_" + id);
        if (busuanziElement) {
          busuanziElement.textContent = data[id] || "0";
        }

        // Update vercount elements
        const vercountElement = document.getElementById("vercount_value_" + id);
        if (vercountElement) {
          vercountElement.textContent = data[id] || "0";
        }
      });
    },
    hideAll: function () {
      this.counterIds.forEach((id) => {
        // Hide busuanzi elements
        const busuanziContainer = document.getElementById(
          "busuanzi_container_" + id,
        );
        if (busuanziContainer) {
          busuanziContainer.style.display = "none";
        }

        // Hide vercount elements
        const vercountContainer = document.getElementById(
          "vercount_container_" + id,
        );
        if (vercountContainer) {
          vercountContainer.style.display = "none";
        }
      });
    },
    showAll: function () {
      this.counterIds.forEach((id) => {
        // Show busuanzi elements
        const busuanziContainer = document.getElementById(
          "busuanzi_container_" + id,
        );
        if (busuanziContainer) {
          busuanziContainer.style.display = "inline";
        }

        // Show vercount elements
        const vercountContainer = document.getElementById(
          "vercount_container_" + id,
        );
        if (vercountContainer) {
          vercountContainer.style.display = "inline";
        }
      });
    },
  };

  documentReady(() => {
    visitorCounterCaller.fetch(
      visitorCounterDisplay.updateText.bind(visitorCounterDisplay)
    );
  });
})();
