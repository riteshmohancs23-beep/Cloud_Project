import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import time
import json

# Configuration
API_BASE_URL = "http://localhost:8000"

st.set_page_config(
    page_title="DataFlow AI | ML Orchestrator",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for premium look
st.markdown("""
    <style>
    .stApp {
        background-color: #050d1a;
        color: #ffffff;
    }
    [data-testid="stSidebar"] {
        background-color: #0a1628;
        border-right: 1px solid #1e293b;
    }
    .metric-card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        padding: 1.5rem;
        border-radius: 1rem;
        text-align: center;
    }
    .stButton>button {
        width: 100%;
        border-radius: 0.75rem;
        height: 3rem;
        font-weight: bold;
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border: none;
        color: white;
    }
    .stButton>button:hover {
        opacity: 0.9;
        transform: scale(1.01);
    }
    </style>
""", unsafe_allow_html=True)

# Session State
if 'token' not in st.session_state:
    st.session_state.token = None
if 'user' not in st.session_state:
    st.session_state.user = None
if 'current_dataset' not in st.session_state:
    st.session_state.current_dataset = None

# API Helpers
def api_request(method, endpoint, data=None, files=None):
    headers = {}
    if st.session_state.token:
        headers["Authorization"] = f"Bearer {st.session_state.token}"
    
    url = f"{API_BASE_URL}{endpoint}"
    try:
        if method == "POST":
            if files:
                response = requests.post(url, headers=headers, files=files)
            else:
                response = requests.post(url, headers=headers, json=data)
        else:
            response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
            return None
    except Exception as e:
        st.error(f"Connection failed: {e}")
        return None

# Sidebar Navigation
with st.sidebar:
    st.title("⚡ DataFlow AI")
    if st.session_state.token:
        st.write(f"Logged in as: **{st.session_state.user}**")
        if st.button("Logout"):
            st.session_state.token = None
            st.rerun()
        
        st.divider()
        nav = st.radio("Navigation", ["Dashboard", "Pipeline", "Analytics", "Playground"])
    else:
        nav = "Login"

# --- LOGIN PAGE ---
if nav == "Login":
    st.header("Welcome to DataFlow")
    tab1, tab2 = st.tabs(["Login", "Register"])
    
    with tab1:
        email = st.text_input("Email", key="login_email")
        password = st.text_input("Password", type="password", key="login_pass")
        if st.button("Login"):
            res = api_request("POST", "/auth/login", {"email": email, "password": password})
            if res:
                st.session_state.token = res["access_token"]
                st.session_state.user = email
                st.success("Login successful!")
                st.rerun()
                
    with tab2:
        new_email = st.text_input("Email", key="reg_email")
        new_password = st.text_input("Password", type="password", key="reg_pass")
        if st.button("Register"):
            res = api_request("POST", "/auth/register", {"email": new_email, "password": new_password})
            if res:
                st.success("Registration successful! Please login.")

# --- DASHBOARD ---
elif nav == "Dashboard":
    st.header("Your Datasets")
    
    # Upload Section
    uploaded_file = st.file_uploader("Upload a CSV or Excel file", type=["csv", "xlsx"])
    if uploaded_file:
        if st.button("Upload to Pipeline"):
            files = {"file": (uploaded_file.name, uploaded_file.getvalue())}
            res = api_request("POST", "/datasets/upload", files=files)
            if res:
                st.success("File uploaded successfully!")
                st.rerun()
    
    st.divider()
    
    # List Datasets
    datasets_res = api_request("GET", "/datasets/")
    if datasets_res and "datasets" in datasets_res:
        datasets = datasets_res["datasets"]
        for ds in datasets:
            col1, col2, col3 = st.columns([3, 2, 1])
            with col1:
                st.write(f"**{ds['filename']}**")
                st.caption(f"Status: {ds['status']}")
            with col2:
                st.caption(f"ID: {ds['id'][:8]}...")
            with col3:
                if st.button("Open", key=ds['id']):
                    st.session_state.current_dataset = ds
                    st.rerun()

# --- PIPELINE ---
elif nav == "Pipeline":
    if not st.session_state.current_dataset:
        st.warning("Please select a dataset from the Dashboard first.")
    else:
        ds = st.session_state.current_dataset
        st.header(f"Pipeline: {ds['filename']}")
        st.caption(f"Status: {ds['status']}")
        
        # Stages
        stages = [
            ("Profile", "PROFILED", "/profile"),
            ("Clean", "CLEANED", "/clean"),
            ("Analyze", "ANALYZED", "/analyze"),
        ]
        
        for name, target_status, endpoint in stages:
            col1, col2 = st.columns([3, 1])
            with col1:
                st.write(f"### Stage: {name}")
                if ds['status'] == target_status:
                    st.success("Completed")
                elif stages.index((name, target_status, endpoint)) > 0 and ds['status'] != stages[stages.index((name, target_status, endpoint))-1][1]:
                    st.info("Waiting for previous stage...")
                else:
                    st.info("Ready to process")
            with col2:
                if st.button(f"Run {name}", key=f"run_{name}"):
                    with st.spinner(f"Running {name}..."):
                        res = api_request("POST", f"/datasets/{ds['id']}{endpoint}")
                        if res:
                            st.session_state.current_dataset['status'] = target_status
                            st.success(f"{name} complete!")
                            st.rerun()
        
        # Training Stage
        st.divider()
        st.write("### Stage: Train ML Model")
        if ds['status'] == 'ANALYZED' or ds['status'] == 'TRAINED':
            target_col = st.text_input("Target Column")
            task_type = st.selectbox("Task Type", ["classification", "regression"])
            model_type = st.selectbox("Model Type", ["random_forest", "logistic_regression", "linear_regression"])
            
            use_reduction = st.checkbox("Enable Feature Reduction (Top Features)")
            n_comp = st.number_input("Number of Features", min_value=1, max_value=20, value=5) if use_reduction else 2
            
            if st.button("Train Model"):
                payload = {
                    "target_column": target_col,
                    "task_type": task_type,
                    "model_type": model_type,
                    "use_pca": use_reduction,
                    "n_components": n_comp
                }
                with st.spinner("Training model..."):
                    res = api_request("POST", f"/datasets/{ds['id']}/ml/train", data=payload)
                    if res:
                        st.session_state.current_dataset['status'] = 'TRAINED'
                        st.success("Training complete!")
                        st.json(res["metrics"])

# --- ANALYTICS ---
elif nav == "Analytics":
    if not st.session_state.current_dataset or st.session_state.current_dataset['status'] not in ['ANALYZED', 'TRAINED']:
        st.warning("Please complete the Analyze stage first.")
    else:
        ds = st.session_state.current_dataset
        res = api_request("GET", f"/datasets/{ds['id']}/analytics")
        
        if res:
            st.header(f"Analytics Dashboard: {ds['filename']}")
            
            # Data Health Section
            if res.get("cleaned_stats"):
                st.subheader("🛡️ Data Health (Post-Cleaning)")
                cs = res["cleaned_stats"]
                hcol1, hcol2, hcol3 = st.columns(3)
                hcol1.metric("Rows", cs.get("row_count"))
                hcol2.metric("Nulls Filled", cs.get("nulls_filled"))
                hcol3.metric("Outliers Removed", cs.get("outliers_removed"))
            
            # Deeper Analytics
            analytics_data = res.get("analytics")
            if analytics_data:
                # Numeric Summary Table
                st.subheader("📊 Numeric Summary")
                summary_df = pd.DataFrame(analytics_data["numeric_summary"])
                st.dataframe(summary_df.T, use_container_width=True)
                
                # Skewness
                if analytics_data.get("skewness"):
                    st.subheader("📈 Column Skewness")
                    skew_df = pd.Series(analytics_data["skewness"]).sort_values()
                    fig_skew = px.bar(x=skew_df.index, y=skew_df.values, labels={'x': 'Feature', 'y': 'Skewness'})
                    st.plotly_chart(fig_skew, use_container_width=True)
                
                # Correlation Matrix
                if analytics_data.get("correlation_matrix"):
                    st.subheader("🔗 Correlation Heatmap")
                    corr_df = pd.DataFrame(analytics_data["correlation_matrix"])
                    fig_corr = px.imshow(corr_df, text_auto=True, color_continuous_scale='RdBu_r')
                    st.plotly_chart(fig_corr, use_container_width=True)
            else:
                st.info("Additional analytics not yet computed. Run the Analyze stage to see more.")

# --- PLAYGROUND ---
elif nav == "Playground":
    if not st.session_state.current_dataset or st.session_state.current_dataset['status'] != 'TRAINED':
        st.warning("Please complete model training first.")
    else:
        ds = st.session_state.current_dataset
        model_info = api_request("GET", f"/datasets/{ds['id']}/ml/model")
        samples = api_request("GET", f"/datasets/{ds['id']}/sample")
        
        if model_info:
            st.header("Model Playground")
            
            # Metrics
            cols = st.columns(len(model_info["metrics"]))
            for i, (metric, value) in enumerate(model_info["metrics"].items()):
                with cols[i]:
                    display_val = f"{value:.4f}" if value is not None else "N/A"
                    st.metric(metric.upper(), display_val)
            
            st.divider()
            
            # Sample Data Picker
            if samples:
                st.subheader("Quick Sample Picker")
                sample_df = pd.DataFrame(samples)
                selected_sample_idx = st.selectbox("Choose a sample row to pre-fill", range(len(samples)))
                selected_sample = samples[selected_sample_idx]
            
            st.divider()
            
            # Prediction Form
            st.subheader("Enter Feature Values")
            features = model_info.get("selected_features", [])
            inputs = {}
            
            col_form1, col_form2 = st.columns(2)
            for i, feat in enumerate(features):
                with col_form1 if i % 2 == 0 else col_form2:
                    default_val = str(selected_sample.get(feat, "")) if samples else ""
                    inputs[feat] = st.text_input(feat, value=default_val)
            
            if st.button("Predict"):
                res = api_request("POST", f"/datasets/{ds['id']}/ml/predict", data=inputs)
                if res:
                    st.balloons()
                    st.success(f"### Prediction: {res['prediction']}")

# Footer
st.sidebar.divider()
st.sidebar.caption("DataFlow AI v1.2 | Powering intelligent pipelines")
