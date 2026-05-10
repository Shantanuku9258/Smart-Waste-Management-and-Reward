import pandas as pd
import numpy as np
import os
import re

def clean_column_names(df):
    df.columns = df.columns.str.strip().str.lower().str.replace('[^a-z0-9_]', '_', regex=True)
    df.columns = [re.sub('_+', '_', col).strip('_') for col in df.columns]
    return df

def generate_pipeline():
    # File paths
    base_dir = 'c:/Users/manav/Desktop/SmartWasteManagement/ml-service/data'
    file1 = os.path.join(base_dir, 'RS_Session_254_AU_2294_1.csv')
    file2 = os.path.join(base_dir, 'RS_Session_266_AU_2384_A.csv')
    file3 = os.path.join(base_dir, 'RS_Session_258_AU_1002_A_and_B.csv')
    
    # 1. Load data
    df_states = pd.read_csv(file1)
    df_gen = pd.read_csv(file2)
    df_col = pd.read_csv(file3)
    
    # 2. Clean column names
    df_states = clean_column_names(df_states)
    df_gen = clean_column_names(df_gen)
    df_col = clean_column_names(df_col)
    
    # Clean df_states
    df_states = df_states[df_states['state_ut'].str.lower() != 'total'].copy()
    df_states.rename(columns={'state_ut': 'state', 'number_of_collection_centres': 'collection_centres'}, inplace=True)
    df_states['collection_centres'] = pd.to_numeric(df_states['collection_centres'], errors='coerce').fillna(0)
    
    # Clean df_gen
    df_gen['year'] = df_gen['financial_year'].str.extract(r'^(\d{4})').astype(int)
    df_gen.rename(columns={'e_waste_generation_metric_ton': 'generation'}, inplace=True)
    
    # Clean df_col
    df_col['year'] = df_col['financial_year'].str.extract(r'^(\d{4})').astype(int)
    df_col.rename(columns={
        'generation_in_tonne': 'generation',
        'quantity_of_e_waste_collected_dismantled_and_recycled_disposed_in_tonne': 'collected',
        'quantity_of_e_waste_collected_dismantled_and_recycled_disposed_in': 'collection_percentage'
    }, inplace=True)
    
    # Combine national data
    national_df = pd.merge(df_gen[['year', 'generation']], df_col[['year', 'collected', 'collection_percentage']], on='year', how='outer')
    
    # Fill in missing generation from df_col if any
    gen_map = df_col.set_index('year')['generation'].to_dict()
    national_df['generation'] = national_df['generation'].fillna(national_df['year'].map(gen_map))
    
    # Sort and interpolate missing collected and percentages
    national_df = national_df.sort_values('year').reset_index(drop=True)
    
    # Interpolate collection percentage
    national_df['collection_percentage'] = national_df['collection_percentage'].interpolate(method='linear', limit_direction='both')
    # Calculate missing collected amounts
    mask = national_df['collected'].isna()
    national_df.loc[mask, 'collected'] = national_df.loc[mask, 'generation'] * (national_df.loc[mask, 'collection_percentage'] / 100)
    
    # 3. Use state collection centres as weights
    total_centres = df_states['collection_centres'].sum()
    df_states['weight'] = df_states['collection_centres'] / total_centres
    
    # 4 & 5. Expand to state-wise yearly records (2017-2024)
    years = list(range(2017, 2025))
    expanded_rows = []
    
    # Linear projection for national data for any missing years up to 2024
    for y in years:
        if y not in national_df['year'].values:
            last_2 = national_df.tail(2)
            gen_diff = last_2['generation'].iloc[1] - last_2['generation'].iloc[0]
            col_pct_diff = last_2['collection_percentage'].iloc[1] - last_2['collection_percentage'].iloc[0]
            
            new_gen = national_df['generation'].iloc[-1] + gen_diff
            new_pct = national_df['collection_percentage'].iloc[-1] + col_pct_diff
            new_col = new_gen * (new_pct / 100)
            
            national_df.loc[len(national_df)] = [y, new_gen, new_col, new_pct]
    
    national_df = national_df.sort_values('year').reset_index(drop=True)
    
    np.random.seed(42)
    
    for _, state_row in df_states.iterrows():
        state = state_row['state']
        centres = state_row['collection_centres']
        weight = state_row['weight']
        
        for _, nat_row in national_df.iterrows():
            year = int(nat_row['year'])
            
            # State's annual allocation
            state_annual_gen = nat_row['generation'] * weight
            state_annual_col = nat_row['collected'] * weight
            
            # Distribute across 12 months with Dirichlet to maintain exact annual sums
            month_dist = np.random.dirichlet(np.ones(12) * 2) 
            month_gen = state_annual_gen * month_dist
            
            col_noise = np.random.normal(1.0, 0.05, 12)
            month_col_raw = month_gen * (nat_row['collection_percentage'] / 100) * col_noise
            
            # Avoid division by zero when normalizing
            if month_col_raw.sum() == 0:
                month_col = np.zeros(12)
            else:
                month_col = month_col_raw * (state_annual_col / month_col_raw.sum())
            
            for m in range(1, 13):
                gen = month_gen[m-1]
                col = month_col[m-1]
                pct = (col / gen * 100) if gen > 0 else 0
                
                expanded_rows.append({
                    'state': state,
                    'year': year,
                    'month': m,
                    'collection_centres': centres,
                    'estimated_generation': round(gen, 2),
                    'estimated_collected': round(col, 2),
                    'collection_percentage': round(pct, 2)
                })
                
    final_df = pd.DataFrame(expanded_rows)
    
    # 7. Create ML labels
    gen_q25 = final_df['estimated_generation'].quantile(0.25)
    gen_q75 = final_df['estimated_generation'].quantile(0.75)
    
    final_df['demand_level'] = pd.cut(
        final_df['estimated_generation'], 
        bins=[-np.inf, gen_q25, gen_q75, np.inf], 
        labels=['Low', 'Medium', 'High']
    )
    
    pct_q25 = final_df['collection_percentage'].quantile(0.25)
    pct_q75 = final_df['collection_percentage'].quantile(0.75)
    
    final_df['priority_level'] = pd.cut(
        final_df['collection_percentage'],
        bins=[-np.inf, pct_q25, pct_q75, np.inf],
        labels=['High', 'Medium', 'Low'] 
    )
    
    print(f"Total rows generated: {len(final_df)}")
    
    yearly_totals = final_df.groupby('year')['estimated_generation'].sum().round(0)
    print("\nYearly Generated Totals in Dataset:")
    print(yearly_totals)
    print("\nOriginal National Generated:")
    print(national_df[['year', 'generation']].set_index('year').round(0))
    
    # 10. Save
    out_path = os.path.join(base_dir, 'ewaste_training_data.csv')
    final_df.to_csv(out_path, index=False)
    print(f"\nSaved successfully to {out_path}")

if __name__ == '__main__':
    generate_pipeline()
