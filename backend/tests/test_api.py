import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_and_jwt_payload():
    # Login as Admin
    res = client.post("/api/auth/login", json={
        "email": "admin@peoplepay360.com",
        "password": "Admin@123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["email"] == "admin@peoplepay360.com"

def test_rbac_protection():
    # Login as Employee
    emp_res = client.post("/api/auth/login", json={
        "email": "employee@peoplepay360.com",
        "password": "Employee@123"
    })
    assert emp_res.status_code == 200
    emp_token = emp_res.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}

    # Employee tries to list users (Admin only) -> should return 403
    forbidden_res = client.get("/api/users", headers=emp_headers)
    assert forbidden_res.status_code == 403

    # Employee tries to create payrun (Payroll roles only) -> should return 403
    payrun_forbidden = client.post("/api/payruns", headers=emp_headers, json={
        "name": "Unauthorized Payrun",
        "period_start": "2026-11-01",
        "period_end": "2026-11-30",
        "pay_date": "2026-11-30"
    })
    assert payrun_forbidden.status_code == 403

def test_dashboard_metrics():
    res = client.post("/api/auth/login", json={
        "email": "admin@peoplepay360.com",
        "password": "Admin@123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert "kpis" in data
    assert "salary_trends" in data
    assert data["kpis"]["total_employees"] >= 8

def test_employees_hub():
    res = client.post("/api/auth/login", json={
        "email": "admin@peoplepay360.com",
        "password": "Admin@123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    emp_list = client.get("/api/employees", headers=headers)
    assert emp_list.status_code == 200
    employees = emp_list.json()
    assert len(employees) >= 8

    # Check 360 sub-resources for employee 1
    c_res = client.get(f"/api/employees/{employees[0]['id']}/contracts", headers=headers)
    assert c_res.status_code == 200

    a_res = client.get(f"/api/employees/{employees[0]['id']}/attendance", headers=headers)
    assert a_res.status_code == 200

def test_payroll_workflow_and_pdf():
    # Login as Payroll Manager
    res = client.post("/api/auth/login", json={
        "email": "payrollmanager@peoplepay360.com",
        "password": "PayrollManager@123"
    })
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Payrun
    create_res = client.post("/api/payruns", headers=headers, json={
        "name": "November 2026 Test Payrun",
        "period_start": "2026-11-01",
        "period_end": "2026-11-30",
        "pay_date": "2026-11-30",
        "notes": "Automated test payrun batch"
    })
    assert create_res.status_code == 201
    payrun_id = create_res.json()["id"]

    # 2. Compute Payrun via Payroll Engine
    compute_res = client.post(f"/api/payruns/{payrun_id}/compute", headers=headers)
    assert compute_res.status_code == 200
    comp_data = compute_res.json()
    assert comp_data["status"] == "COMPUTED"
    assert comp_data["total_gross"] > 0
    assert comp_data["total_net"] > 0

    # 3. Validate Payrun
    val_res = client.post(f"/api/payruns/{payrun_id}/validate", headers=headers)
    assert val_res.status_code == 200
    assert val_res.json()["status"] == "VALIDATED"

    # 4. Mark Paid
    paid_res = client.post(f"/api/payruns/{payrun_id}/mark-paid", headers=headers)
    assert paid_res.status_code == 200
    assert paid_res.json()["status"] == "PAID"

    # 5. Fetch Payslips and download PDF
    ps_res = client.get(f"/api/payruns/{payrun_id}/payslips", headers=headers)
    assert ps_res.status_code == 200
    payslips = ps_res.json()
    assert len(payslips) > 0

    pdf_res = client.get(f"/api/payslips/{payslips[0]['id']}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000 # PDF contains binary bytes
