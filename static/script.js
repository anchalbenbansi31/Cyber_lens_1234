const BACKEND_URL =
    "https://tension-films-affiliates-cope.trycloudflare.com";

/* =========================
   ELEMENTS
========================= */

const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const dropzone = document.getElementById("dropzone");

const selectedBox = document.getElementById("selected");
const thumb = document.getElementById("thumb");
const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");

const removeBtn = document.getElementById("removeBtn");
const analyzeBtn = document.getElementById("analyzeBtn");
const againBtn = document.getElementById("againBtn");

const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");

const emptyReport = document.getElementById("emptyReport");
const loading = document.getElementById("loading");
const report = document.getElementById("report");
const errorBox = document.getElementById("errorBox");

const risk = document.getElementById("risk");
const verdict = document.getElementById("verdict");
const verdictPill = document.getElementById("verdictPill");
const confidence = document.getElementById("confidence");

const verificationId =
    document.getElementById("verificationId");

const resultFile =
    document.getElementById("resultFile");

const resultStatus =
    document.getElementById("resultStatus");

const evidence =
    document.getElementById("evidence");


let selectedFile = null;


/* =========================
   BACKEND STATUS
========================= */

async function checkBackend() {

    try {

        const response = await fetch(
            `${BACKEND_URL}/api/health`,
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data = await response.json();

        console.log(
            "Backend connected:",
            data
        );

        if (statusText) {
            statusText.textContent =
                "Backend online";
        }

        if (statusDot) {
            statusDot.style.background =
                "#20c997";
        }

    } catch (error) {

        console.error(
            "Backend connection failed:",
            error
        );

        if (statusText) {
            statusText.textContent =
                "Backend offline";
        }

        if (statusDot) {
            statusDot.style.background =
                "#e03131";
        }
    }
}


/* =========================
   BROWSE BUTTON
========================= */

if (browseBtn && fileInput) {

    browseBtn.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );
}


/* =========================
   FILE INPUT
========================= */

if (fileInput) {

    fileInput.addEventListener(
        "change",
        function (event) {

            const file =
                event.target.files[0];

            if (file) {
                handleFile(file);
            }

        }
    );
}


/* =========================
   HANDLE FILE
========================= */

function handleFile(file) {

    if (!file) {
        return;
    }

    const allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    ];

    const fileNameLower =
        file.name.toLowerCase();

    const validExtension =
        allowedExtensions.some(
            extension =>
                fileNameLower.endsWith(
                    extension
                )
        );

    if (!validExtension) {

        alert(
            "Please upload JPG, JPEG, PNG or WEBP image."
        );

        return;
    }


    const maxSize =
        20 * 1024 * 1024;

    if (file.size > maxSize) {

        alert(
            "File size must be less than 20 MB."
        );

        return;
    }


    selectedFile = file;


    /* Show selected section */

    if (selectedBox) {
        selectedBox.classList.remove(
            "hidden"
        );
    }


    /* File name */

    if (fileName) {
        fileName.textContent =
            file.name;
    }


    /* File size */

    if (fileMeta) {

        fileMeta.textContent =
            formatFileSize(
                file.size
            );
    }


    /* Preview */

    if (thumb) {

        const imageURL =
            URL.createObjectURL(file);

        thumb.src = imageURL;

        thumb.onload = function () {
            URL.revokeObjectURL(
                imageURL
            );
        };
    }


    /* Enable analyze */

    if (analyzeBtn) {

        analyzeBtn.disabled = false;

    }


    /* Hide old results */

    hideError();

    if (emptyReport) {
        emptyReport.classList.remove(
            "hidden"
        );
    }

    if (report) {
        report.classList.add(
            "hidden"
        );
    }

    console.log(
        "Selected file:",
        file.name
    );
}


/* =========================
   FILE SIZE
========================= */

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {

        return (
            (bytes / 1024).toFixed(1)
            + " KB"
        );

    }

    return (
        (bytes / (1024 * 1024))
            .toFixed(2)
        + " MB"
    );
}


/* =========================
   DRAG & DROP
========================= */

if (dropzone) {

    dropzone.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

            dropzone.classList.add(
                "dragging"
            );
        }
    );


    dropzone.addEventListener(
        "dragleave",
        function () {

            dropzone.classList.remove(
                "dragging"
            );
        }
    );


    dropzone.addEventListener(
        "drop",
        function (event) {

            event.preventDefault();

            dropzone.classList.remove(
                "dragging"
            );

            const file =
                event.dataTransfer.files[0];

            if (file) {
                handleFile(file);
            }
        }
    );
}


/* =========================
   REMOVE FILE
========================= */

if (removeBtn) {

    removeBtn.addEventListener(
        "click",
        function () {

            selectedFile = null;

            if (fileInput) {
                fileInput.value = "";
            }

            if (selectedBox) {
                selectedBox.classList.add(
                    "hidden"
                );
            }

            if (analyzeBtn) {
                analyzeBtn.disabled = true;
            }

            if (thumb) {
                thumb.removeAttribute(
                    "src"
                );
            }

        }
    );
}


/* =========================
   ANALYZE BUTTON
========================= */

if (analyzeBtn) {

    analyzeBtn.addEventListener(
        "click",
        analyzeFile
    );
}


/* =========================
   ANALYZE FILE
========================= */

async function analyzeFile() {

    if (!selectedFile) {

        alert(
            "Please select an image first."
        );

        return;
    }


    analyzeBtn.disabled = true;

    analyzeBtn.textContent =
        "Analyzing...";


    hideError();


    if (emptyReport) {
        emptyReport.classList.add(
            "hidden"
        );
    }

    if (report) {
        report.classList.add(
            "hidden"
        );
    }

    if (loading) {
        loading.classList.remove(
            "hidden"
        );
    }


    try {

        const formData =
            new FormData();

        formData.append(
            "file",
            selectedFile
        );


        console.log(
            "Sending image to:",
            `${BACKEND_URL}/api/analyze`
        );


        const response =
            await fetch(
                `${BACKEND_URL}/api/analyze`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        console.log(
            "Analysis result:",
            data
        );


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                `HTTP ${response.status}`
            );
        }


        displayResult(data);


    } catch (error) {

        console.error(
            "Analysis failed:",
            error
        );

        showError(
            error.message ||
            "AI analysis failed."
        );

    } finally {

        if (loading) {
            loading.classList.add(
                "hidden"
            );
        }

        analyzeBtn.disabled = false;

        analyzeBtn.textContent =
            "Analyze file";
    }
}


/* =========================
   DISPLAY RESULT
========================= */

function displayResult(data) {

    const analysis =
        data.analysis || {};


    const verdictValue =
        analysis.verdict ||
        "Needs Verification";


    const confidenceValue =
        Number(
            analysis.confidence || 0
        );


    const riskValue =
        Number(
            analysis.risk_score || 0
        );


    if (risk) {

        risk.textContent =
            riskValue.toFixed(2);

    }


    if (verdict) {

        verdict.textContent =
            verdictValue;

    }


    if (confidence) {

        confidence.textContent =
            confidenceValue.toFixed(2)
            + "%";

    }


    if (verificationId) {

        verificationId.textContent =
            data.verification_id ||
            "-";

    }


    if (resultFile) {

        resultFile.textContent =
            data.file?.name ||
            selectedFile.name;

    }


    if (resultStatus) {

        resultStatus.textContent =
            data.status ||
            "completed";

    }


    /* Verdict pill */

    if (verdictPill) {

        verdictPill.textContent =
            verdictValue;

        verdictPill.className =
            "pill";


        const lower =
            verdictValue.toLowerCase();


        if (
            lower.includes("fake")
        ) {

            verdictPill.classList.add(
                "danger"
            );

        } else if (
            lower.includes("authentic") ||
            lower.includes("real")
        ) {

            verdictPill.classList.add(
                "safe"
            );

        } else {

            verdictPill.classList.add(
                "warning"
            );
        }
    }


    /* Evidence */

    if (evidence) {

        evidence.innerHTML = "";


        const evidenceList =
            Array.isArray(
                analysis.evidence
            )
                ? analysis.evidence
                : [];


        evidenceList.forEach(
            item => {

                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    item;

                evidence.appendChild(
                    li
                );
            }
        );
    }


    if (report) {

        report.classList.remove(
            "hidden"
        );

    }

    if (emptyReport) {

        emptyReport.classList.add(
            "hidden"
        );

    }

    console.log(
        "CyberLens result displayed."
    );
}


/* =========================
   ERROR
========================= */

function showError(message) {

    if (!errorBox) {
        alert(message);
        return;
    }


    errorBox.textContent =
        "Analysis failed: " +
        message;


    errorBox.classList.remove(
        "hidden"
    );


    if (report) {
        report.classList.add(
            "hidden"
        );
    }

    if (emptyReport) {
        emptyReport.classList.add(
            "hidden"
        );
    }
}


function hideError() {

    if (errorBox) {

        errorBox.classList.add(
            "hidden"
        );

        errorBox.textContent =
            "";
    }
}


/* =========================
   NEW ANALYSIS
========================= */

if (againBtn) {

    againBtn.addEventListener(
        "click",
        function () {

            selectedFile = null;

            if (fileInput) {
                fileInput.value = "";
            }

            if (selectedBox) {
                selectedBox.classList.add(
                    "hidden"
                );
            }

            if (analyzeBtn) {
                analyzeBtn.disabled = true;
            }

            if (report) {
                report.classList.add(
                    "hidden"
                );
            }

            if (errorBox) {
                errorBox.classList.add(
                    "hidden"
                );
            }

            if (emptyReport) {
                emptyReport.classList.remove(
                    "hidden"
                );
            }

        }
    );
}


/* =========================
   START
========================= */

checkBackend();

setInterval(
    checkBackend,
    15000
);