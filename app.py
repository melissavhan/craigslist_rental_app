import dill
import pickle
import pandas as pd
import bs4
from bs4 import BeautifulSoup
import re
import requests

import numpy as np
from flask import Flask, request, render_template


WALK_SCORE_ROOT_URL = 'https://www.walkscore.com/score/'

app = Flask(__name__)

model = pickle.load(open('models/model_sgd.pkl', 'rb'))
pipeline = dill.load(open('models/pipeline.dll', 'rb'))

@app.route('/')
def home():
    return render_template('home.html', prediction=0)


@app.route('/predict_rent', methods=['POST'])
def predict_rent():
    result = _predict_rent(request.get_json())
    return {'prediction': result}


def _predict_rent(form_data):
    features_dict = {}

    # Get individual scores
    scores = _get_address_score(form_data['listing_address'], form_data['topic'])
    features_dict['walk_score'] = scores[0]
    features_dict['transit_score'] = scores[1]
    features_dict['bike_score'] = scores[2]

    features_dict['listing_address'] = form_data['listing_address']
    features_dict['rent_period_monthly'] = 1

    # Listing neighborhood
    features_dict['listing_nh'] = form_data['chapter']

    # Numeric features
    features_dict['listing_sqft'] = int(form_data['listing_sqft'])
    # no_bedrooms is an int
    features_dict['no_bedrooms'] = int(form_data['no_bedrooms'].replace('+', ''))
    # no_bathrooms is a float
    features_dict['no_bathrooms'] = float(form_data['no_bathrooms'].replace('+', '').replace('shared', '0.5'))

    # int_features = [int(x) for x in request.form.values()]
    # features = [np.array(int_features)]



    # Add single choice options first
    def single_choice(options, feature):
        for option in options:
            features_dict[option] = 0
        if form_data[feature]:
            features_dict[form_data[feature]] = 1
        return features_dict

    laundry_options = ['laundry_in_bldg','laundry_in_unit', 'laundry_has_hookup', 'laundry_onsite','laundry_not_onsite']
    single_choice(laundry_options, 'laundry')

    # Parking
    parking_options = ['parking_carport', 'parking_attached_garage',
       'parking_detached_garage', 'parking_offstreet', 'parking_street',
       'parking_valet', 'parking_none']
    single_choice(parking_options, 'parking')

    # Housing
    housing_options = ['housing_condo','housing_apt', 'housing_flat', 'housing_house', 'housing_townhouse']
    single_choice(housing_options, 'housing')

    feature_names = ['animals_cats', 'animals_dogs', 'smoking',
                     'wheelchair accessible', 'has_AC', 'hasEVCharging', 'is_rent_controlled', 'pets_allowed', 'has_amenities',
                     'premium_finishes', 'ensuite_bath', 'has_balcony', 'has_backyard',
                     'has_view', 'multi-level', 'is_an_SRO']

    # Binary features
    for feature in feature_names:
        if feature in form_data:

            if form_data[feature] == 'on':
                features_dict[feature] = 1
        # Fill with 0 if empty
        else:
            features_dict[feature] = 0



    # print(features)
    # print(request.form)
    dct = {k: [v] for k, v in features_dict.items()}
    df = pd.DataFrame(dct)
    df_transformed = pipeline.transform(df)

    prediction = model.predict(df_transformed)
    result = prediction[0]
    # print(pipeline)
    # print(features_dict)
    return result


def _get_address_score(address, city):
    full_address = address + " " + city
    full_address = full_address.replace('"', '')
    address_url = "-".join(str(address).split())
    city_url = "-".join(str(city).split())
    walk_score_url = WALK_SCORE_ROOT_URL + address_url + "-" + city_url
    r = requests.get(walk_score_url)
    if r.status_code != 200:
        print('Request: {}; Status code: {}'.format(r, r.status_code))
        return [None, None, None]

    soup = bs4.BeautifulSoup(r.text, 'html.parser')

    # Get walk score
    div_walk = soup.find("div",
                         {"class": "block-header-badge score-info-link", "data-eventsrc": "score page walk badge"})
    if div_walk == None:
        walk_score = None
    else:
        img_walk = div_walk.findChild('img')
        walk_text_before_regex = img_walk.get('src')
        walk_score = int(re.search('/(\d+)\.svg$', walk_text_before_regex)[1])

    # Get transit score
    div_transit = soup.find("div", {"class": "block-header-badge score-info-link",
                                    "data-eventsrc": "score page transit badge"})
    if div_transit == None:
        transit_score = None
    else:
        img_transit = div_transit.findChild('img')
        transit_text_before_regex = img_transit.get('src')
        transit_score = int(re.search('/(\d+)\.svg$', transit_text_before_regex)[1])

    # Get biking score
    div_bike = soup.find("div",
                         {"class": "block-header-badge score-info-link", "data-eventsrc": "score page bike badge"})
    if div_bike == None:
        bike_score = None
    else:
        img_bike = div_bike.findChild('img')
        bike_text_before_regex = img_bike.get('src')
        bike_score = int(re.search('/(\d+)\.svg$', bike_text_before_regex)[1])

    return [walk_score,transit_score,bike_score]

if __name__ == "__main__":
    app.run(debug=True)
