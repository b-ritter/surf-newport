<?php
if($_POST['action'] == "getForecast") {
  /**
   * we can pass any action like block, follow, unfollow, send PM....
   * if we get a 'follow' action then we could take the user ID and create a SQL command
   * but with no database, we can simply assume the follow action has been completed and return 'ok'
  **/

  $forecastEndpoint = 'http://magicseaweed.com/api/884371cf4fc4156f6e7320b603e18a66/forecast/?spot_id={spot}&units=us&fields=swell.*,wind.*,timestamp';
  $url = str_replace('{spot}', $_POST['spot'], $forecastEndpoint);
  $forecast = file_get_contents($url);

  $dog = 'bark';

  echo $forecast;
}
?>
