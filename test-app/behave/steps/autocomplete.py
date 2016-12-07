####
#### Steps centered around dealing with the various
#### autocomplete/search boxes.
####

from behave import *
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@given('I type "{text}" into the general search')
def step_impl(context, text):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_id('gsf-query')
    webelt.send_keys(text)

@given('I submit the general search')
def step_impl(context):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_id('query-form')
    webelt.submit()

# @given('I wait "{seconds}" seconds')
# def step_impl(context, seconds):        
#     context.browser.implicitly_wait(int(seconds))

## TODO/BUG: Make use of the explicit waits instead of the (rather
## lame) implicit waits:
## http://selenium-python.readthedocs.org/en/latest/waits.html
@given('I wait until "{item}" appears in the autocomplete')
def step_impl(context, item):

    ## Implicity poll for items to appear for 10 seconds.
    context.browser.implicitly_wait(10)
    webelt = context.browser.find_element_by_link_text(item)

    ## TODO: 
    #     wait = WebDriverWait(context.browser, 10)
    #     element = wait.until(
    #             EC.element_to_be_clickable((By.ID,'someid'))
    #     )
    #     visibility_of_element_located(        
    #     element = WebDriverWait(context.browser, 1000).until(
    #     EC.text_to_be_present_in_element(
    #         context.browser.find_element_by_class_name('ui-autocomplete'), item
    #     )
    # )

@given('I click the general search item "{item}"')
def step_impl(context, item):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_link_text(item)
    webelt.click()

@given('I type "{text}" into the input with id "{elid}"')
def step_impl(context, text, elid):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_id(elid)
    webelt.send_keys(text)

@given('I click the form button with id "{elid}"')
def step_impl(context, elid):
    #print(context.browser.title)
    webelt = context.browser.find_element_by_id(elid)
    webelt.click()
