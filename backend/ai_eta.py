from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([
    [1],
    [2],
    [3],
    [4],
    [5]
])

y = np.array([
    10,
    18,
    29,
    41,
    52
])

model = LinearRegression()
model.fit(X, y)


def predict_eta(position):
    prediction = model.predict([[position]])
    return round(float(prediction[0]), 2)

from ai_eta import predict_eta

print(predict_eta(3))