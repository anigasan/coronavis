"""
DIVI - Hospitals with their capacities
https://www.divi.de/register/intensivregister?view=items
"""
import time
import pandas

import urllib.parse
import urllib.request

from bs4 import BeautifulSoup

from geopy.geocoders import Nominatim


def legends(class_input):
    if 'green' in class_input:
        return 'Verfügbar'
    if 'yellow' in class_input:
        return 'Begrenzt'
    if 'red' in class_input:
        return 'Ausgelastet'
    if 'unavailable' in class_input:
        return 'Nicht verfügbar'
    return ''
    
    
def get_html_content(url, data):
    data = urllib.parse.urlencode(data)
    data = data.encode('utf-8')
    page = urllib.request.urlopen(url, data)

    html_data = page.read()
    return html_data


def remove_spaces(text):
    text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
    text = text.strip()
    text = ' '.join(text.split())
    return text


def get_geo_location(adress):
    geolocator = Nominatim(user_agent='COVID-19', timeout=10)
    location = geolocator.geocode(adress)
    loc = (None, None)
    if location != None:
        loc = (location.latitude, location.longitude)
        
    return loc, location


def crawl_webpage(url, data):
    
    html_data = get_html_content(url, data)

    soup = BeautifulSoup(html_data, 'html.parser')

    # print(soup.prettify())

    hospital_entries = []
    hospital_table = soup.find(id='dataList').find('tbody').find_all('tr')
    for hospital_row in hospital_table:
        hospital_entry = []
        for i, td in enumerate(hospital_row.find_all('td')):
            tmp = remove_spaces(td.text)
            
            if i == 0:
                small = td.find_all('small')
                if len(small) > 1:
                    adress = ' '.join(small[-2].text.split()) + ', ' + ' '.join(small[-1].text.split())
                else:
                    adress = tmp
                for small in td.find_all('small'):
                    small.decompose()
                name = remove_spaces(td.text)
                hospital_entry.append(name)
                hospital_entry.append(adress)
                hospital_entry.append(tmp)
            else:
                if tmp == '' and td.span != None:
                    tmp = ' '.join(td.span.get('class'))
                    tmp = legends(tmp)
                if td.find('a'):
                    tmp += ' ' + td.find('a').get('href')
                hospital_entry.append(tmp)
            
        hospital_entries.append(hospital_entry)
        
    return hospital_entries


def get_hospital_geo_locations(hospital_entries):
    len_ = len(hospital_entries)
    for i, hospital_entry in enumerate(hospital_entries):
        adress = hospital_entry[1]
        print(str(i + 1) + ' / ' + str(len_))
        print('Crawled location: ' + adress)
        
        try:
            loc, location = get_geo_location(adress)
            print('Found location: ' + str(location))
            
        except Exception as e:
            loc = (None, None)
            print('Error ' + str(e))
            
        hospital_entry.append(loc)
        hospital_entries[i] = hospital_entry
        
        if i % 10:
            time.sleep(1)
            
    return hospital_entries


if __name__ == "__main__":

    quote_page = 'https://www.divi.de/register/intensivregister?view=items'
    values = {
        'list': {
            'limit': 0
        }
    }

    hospital_entries = crawl_webpage(quote_page, values)
        
    print(hospital_entries[0])
        
    hospital_entries = get_hospital_geo_locations(hospital_entries)

    df = pandas.DataFrame(hospital_entries, columns=['Name', 'Adress', 'String', 'Kontakt', 'Bundesland', 'ICU low care', 'ICU high care', 'ECMO', 'Stand', 'Location'])
    df['Stand'] =  pandas.to_datetime(df['Stand'], format='%d.%m.%Y %H:%M')
    df.to_csv('rki_hospitals.csv')
