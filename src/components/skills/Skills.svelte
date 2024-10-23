<script>
    import { Chart, Card, A, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
    import { ArrowUpOutline, ChevronDownOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  
    const options = {
      series: [
        {
          name: 'Income',
          color: '#31C48D',
          data: ['1420', '1620', '1820', '1420', '1650', '2120']
        },
        {
          name: 'Expense',
          data: ['788', '810', '866', '788', '1100', '1200'],
          color: '#F05252'
        }
      ],
      chart: {
        sparkline: {
          enabled: false
        },
        type: 'bar',
        width: '100%',
        height: 400,
        toolbar: {
          show: false
        }
      },
      fill: {
        opacity: 1
      },
      plotOptions: {
        bar: {
          horizontal: true,
          columnWidth: '100%',
          borderRadiusApplication: 'end',
          borderRadius: 6,
          dataLabels: {
            position: 'top'
          }
        }
      },
      legend: {
        show: true,
        position: 'bottom'
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        shared: true,
        intersect: false,
        formatter: function (value) {
          return '$' + value;
        }
      },
      xaxis: {
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
          },
          formatter: function (value) {
            return '$' + value;
          }
        },
        categories: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisTicks: {
          show: false
        },
        axisBorder: {
          show: false
        }
      },
      yaxis: {
        labels: {
          show: true,
          style: {
            fontFamily: 'Inter, sans-serif',
            cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
          }
        }
      },
      grid: {
        show: true,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: -20
        }
      }
    };
  </script>

<div class="skills">
    <!-- <Chart {options} /> -->
    <ul>
        <li><b>Software<br>Development:</b></li>
        <!-- Docker, Python, C++, R, Django, Flask, FastAPI, JavaScript, React,
        Svelte -->
        <li>Docker</li>
        <li>Python</li>
        <li>C++</li>
        <li>R</li>
        <li>Django</li>
        <li>Flask</li>
        <li>FastAPI</li>
        <li>JavaScript</li>
        <li>React</li>
        <li>Svelte</li>
    </ul>
    <!-- <p>
        <b>Machine Learning:</b> scikit-learn, Pandas, NumPy, Tensorflow, PyTorch, OpenCV, YOLO, NLTK,
        SpaCy, Bert, LLama3, GPT
    </p>
    <p>
        <b>Databases and Cloud:</b> Git, PostgreSQL, MongoDB, Redis, RabbitMQ, nginx, Gunicorn, Spark,
        AWS EC2, S3
    </p> -->
    <ul>
        <li><b>Machine<br>Learning:</b></li>
        <!-- scikit-learn, Pandas, NumPy, Tensorflow, PyTorch, OpenCV, YOLO, NLTK,
        SpaCy, Bert, LLama3, GPT -->
        <li>scikit-learn</li>
        <li>Pandas</li>
        <li>NumPy</li>
        <li>Tensorflow</li>
        <li>PyTorch</li>
        <li>OpenCV</li>
        <li>YOLO</li>
        <li>NLTK</li>
        <li>SpaCy</li>
        <li>Bert</li>
        <li>LLama3</li>
        <li>GPT</li>
        <li>LangChain</li>
    </ul>

    <ul>
        <li><b>Databases<br>and Cloud:</b></li>
        <!-- Git, PostgreSQL, MongoDB, Redis, RabbitMQ, nginx, Gunicorn, Spark,
        AWS EC2, S3 -->
        <li>Git</li>
        <li>PostgreSQL</li>
        <li>MongoDB</li>
        <li>Redis</li>
        <li>RabbitMQ</li>
        <li>nginx</li>
        <li>Gunicorn</li>
        <li>Spark</li>
        <li>AWS EC2</li>
        <li>S3</li>
    </ul>
</div>

<style>
    .skills {
        /* padding: 20px; */
        /* margin-top: 5vh; */
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-gap: 20px;
    }

</style>