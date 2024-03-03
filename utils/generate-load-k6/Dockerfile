# # # cmd para correrlo: 
# docker build -t my-k6-test .
# docker run -e API_URL=http://test.k6.io/ -e VUS=50 -e DURATION=1m -e ENDPOINTS="/contacts.php,/news.php,/browser.php" -e DELIMITER="," my-k6-test
FROM grafana/k6

COPY load_test.js /load_test.js

CMD ["run", "/load_test.js"]