<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Customer Upload | Rudra E-Mitra</title>
    <link rel="stylesheet" href="/styles.css" />
    <style>
      .page {
        max-width: 760px;
        margin: 40px auto;
        padding: 24px;
      }

      .success {
        background: rgba(25, 125, 77, 0.2);
        border: 1px solid rgba(79, 255, 170, 0.4);
        padding: 18px;
        border-radius: 12px;
        margin-top: 20px;
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="container page">
      <div class="card">
        <div class="topbar" style="margin-bottom: 0;">
          <div>
            <div class="small-label">Customer Upload</div>
            <div class="brand" id="shopTitle">CSC Cyber Cafe</div>
          </div>
          <a class="button secondary" href="/" target="_blank">Admin Dashboard</a>
        </div>

        <form id="customerForm" enctype="multipart/form-data">
          <input type="hidden" id="shop" name="shop" value="CSC Cyber Cafe" />

          <div class="form-row">
            <div>
              <label for="customerName">Customer Name</label>
              <input id="customerName" name="customerName" type="text" placeholder="Enter full name" required />
            </div>

            <div>
              <label for="phone">Phone Number</label>
              <input id="phone" name="phone" type="tel" placeholder="Enter phone number" required />
            </div>

            <div>
              <label for="service">Service Type</label>
              <input id="service" name="service" type="text" value="Document Upload / Form Filing" required />
            </div>

            <div>
              <label for="documents">Upload Documents</label>
              <input id="documents" name="documents" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" required />
            </div>

            <div>
              <label for="notes">Notes / Purpose</label>
              <textarea id="notes" name="notes" placeholder="Example: Aadhar scan, passport copy, form for scholarship, PAN document, etc."></textarea>
            </div>
          </div>

          <div class="actions">
            <button type="submit">Upload & Save</button>
            <button class="secondary" type="button" onclick="window.print()">Print Form</button>
          </div>
        </form>

        <div id="successMessage" class="success">
          <strong>Upload successfully done.</strong>
          <div style="margin-top:8px;">Your documents have been saved and are ready for the cyber cafe staff to review and print.</div>
        </div>
      </div>
    </div>

    <script>
      const params = new URLSearchParams(window.location.search);
      const shopName = params.get('shop') || 'CSC Cyber Cafe';
      document.getElementById('shopTitle').textContent = shopName;
      document.getElementById('shop').value = shopName;

      const form = document.getElementById('customerForm');
      const successMessage = document.getElementById('successMessage');

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || 'Upload failed. Please try again.');
          return;
        }

        form.reset();
        successMessage.style.display = 'block';
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    </script>
  </body>
</html>
